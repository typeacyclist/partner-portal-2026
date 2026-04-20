// Trendzact Partners - Proposal Math Engine
//
// Pure-function math module. Reads catalog + draft, returns priced result.
// No DOM, no Firestore, no side effects - just deterministic calculation.
//
// Public API (attached to window.TrendzactMath):
//   calculateProposal(draft, catalog) -> CalculationResult | { errors: [...] }
//   formatMoney(n) -> "$1,234,567"
//   shortUuid()    -> "TZ-XXXXXXXX"
//
// Calculation sequence (Track B spec):
//   1. Resolve company segment       -> presaleMultiplier, careMultiplier
//   2. Resolve license bracket       -> volume multiplier
//   3. For each selected SKU:
//        - Compute line price by pricing.model
//        - Apply volume multiplier to per-user pricing
//   4. Subtotal recurring modules (bundle-eligible, non-BETA)
//   5. Apply bundle discount (formula: min(maxPct, max(0, (n - startAtCount + 1) * perModulePct)))
//   6. Add non-bundle-eligible recurring (CORE, CARE, options, connectors, platform)
//   7. Add one-time charges separately
//   8. Compute multi-year continuity for years 2 and 3 on recurring totals
//   9. Return CalculationResult with breakdowns

(function () {
  'use strict';

  // ----------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------

  function formatMoney(n) {
    if (n == null || isNaN(n)) return '$0';
    var rounded = Math.round(n);
    return '$' + rounded.toLocaleString('en-US');
  }

  function shortUuid() {
    // 8 chars base36, uppercase
    var s = '';
    for (var i = 0; i < 8; i++) {
      s += Math.floor(Math.random() * 36).toString(36);
    }
    return 'TZ-' + s.toUpperCase();
  }

  function findSku(catalog, code) {
    for (var i = 0; i < catalog.skus.length; i++) {
      if (catalog.skus[i].code === code) return catalog.skus[i];
    }
    return null;
  }

  function isBeta(sku) {
    var badges = (sku.selection && sku.selection.displayBadges) || [];
    return badges.indexOf('BETA') !== -1;
  }

  function isRequired(sku) {
    var badges = (sku.selection && sku.selection.displayBadges) || [];
    return badges.indexOf('REQUIRED') !== -1;
  }

  function isModule(sku) {
    return sku.category === '10-Module';
  }

  // ----------------------------------------------------------
  // Resolve company segment
  // ----------------------------------------------------------
  function resolveSegment(catalog, segmentKey) {
    var segs = catalog.companySizeSegments || [];
    for (var i = 0; i < segs.length; i++) {
      if (segs[i].key === segmentKey) return segs[i];
    }
    return null;
  }

  // ----------------------------------------------------------
  // Resolve license bracket - returns multiplier for given user count
  // ----------------------------------------------------------
  function resolveBracket(catalog, userCount) {
    var brackets = catalog.licenseCountBrackets || [];
    for (var i = 0; i < brackets.length; i++) {
      var b = brackets[i];
      if (b.maxUsers === null || userCount <= b.maxUsers) {
        return b;
      }
    }
    // If we ran past all brackets (shouldn't happen with a null-terminated last bracket),
    // return the last one.
    return brackets.length > 0 ? brackets[brackets.length - 1] : { multiplier: 1.00, label: 'unknown' };
  }

  // ----------------------------------------------------------
  // Compute single SKU line price
  // Returns { unitDescription, lineAmountUsd, billingNote }
  // ----------------------------------------------------------
  function priceLine(sku, segment, bracket, userCount) {
    var p = sku.pricing;
    if (!p) {
      return { unitDescription: 'no pricing', lineAmountUsd: 0, billingNote: 'BETA - not yet priced' };
    }

    switch (p.model) {
      case 'flat':
        return {
          unitDescription: formatMoney(p.amountUsd) + ' flat',
          lineAmountUsd: p.amountUsd,
          billingNote: p.billableUnit
        };

      case 'tieredByCompanySize':
        if (!segment) {
          return { unitDescription: 'segment unresolved', lineAmountUsd: 0, billingNote: p.billableUnit };
        }
        var mult = segment[p.multiplierRef] || 1;
        var amt = p.baseAmountUsd * mult;
        return {
          unitDescription: formatMoney(p.baseAmountUsd) + ' base x ' + mult.toFixed(2),
          lineAmountUsd: amt,
          billingNote: p.billableUnit + ' (' + segment.label + ')'
        };

      case 'tieredByLicenseCount':
        if (!bracket) {
          return { unitDescription: 'bracket unresolved', lineAmountUsd: 0, billingNote: p.billableUnit };
        }
        var perUser = p.baseAmountUsdPerUser * bracket.multiplier;
        return {
          unitDescription: formatMoney(p.baseAmountUsdPerUser) + '/user x ' + bracket.multiplier.toFixed(2) + ' = ' + formatMoney(perUser) + '/user',
          lineAmountUsd: perUser * userCount,
          billingNote: p.billableUnit + ' (' + bracket.label + ')'
        };

      case 'flatPerUser':
        return {
          unitDescription: formatMoney(p.amountUsdPerUser) + '/user',
          lineAmountUsd: p.amountUsdPerUser * userCount,
          billingNote: p.billableUnit
        };

      default:
        return { unitDescription: 'unknown model: ' + p.model, lineAmountUsd: 0, billingNote: '' };
    }
  }

  // ----------------------------------------------------------
  // Bundle discount: formula
  //   discount% = min(maxPct, max(0, (n - startAtCount + 1) * perModulePct))
  // n = count of selected eligible modules
  // ----------------------------------------------------------
  function computeBundlePct(catalog, eligibleCount) {
    var bd = catalog.bundleDiscount || { perModulePct: 0, maxPct: 0, startAtCount: 2 };
    if (eligibleCount < bd.startAtCount) return 0;
    var raw = (eligibleCount - bd.startAtCount + 1) * bd.perModulePct;
    return Math.max(0, Math.min(bd.maxPct, raw));
  }

  // ----------------------------------------------------------
  // Main: calculateProposal
  // ----------------------------------------------------------
  function calculateProposal(draft, catalog) {
    var errors = [];

    if (!catalog || !catalog.skus) {
      errors.push('Catalog missing or invalid.');
      return { errors: errors };
    }
    if (!draft) {
      errors.push('Draft is missing.');
      return { errors: errors };
    }

    // Resolve segment + bracket
    var segment = resolveSegment(catalog, draft.companySegment);
    if (!segment) {
      errors.push('Unknown company segment: ' + draft.companySegment);
    }

    var userCount = parseInt(draft.userCount, 10) || 0;
    if (userCount <= 0) {
      errors.push('User count must be greater than 0.');
    }

    var bracket = resolveBracket(catalog, userCount);

    // Build set of selected codes (manual selections + REQUIRED auto-includes)
    var selected = {};
    (draft.selectedSkuCodes || []).forEach(function (c) { selected[c] = true; });

    // Auto-include all REQUIRED skus
    catalog.skus.forEach(function (sku) {
      if (isRequired(sku) && sku.isActive) {
        selected[sku.code] = true;
      }
    });

    // Filter selection: only include skus that exist + are active + not BETA
    var lines = [];
    var skipped = [];
    Object.keys(selected).forEach(function (code) {
      var sku = findSku(catalog, code);
      if (!sku) {
        skipped.push({ code: code, reason: 'not in catalog' });
        return;
      }
      if (!sku.isActive) {
        skipped.push({ code: code, reason: 'inactive' });
        return;
      }
      if (isBeta(sku)) {
        skipped.push({ code: code, reason: 'BETA - cannot be selected' });
        return;
      }
      // Conditional SKUs: parent must be selected
      var sel = sku.selection || {};
      if (sel.mode === 'conditional' && Array.isArray(sel.parentCodes) && sel.parentCodes.length > 0) {
        var anyParent = sel.parentCodes.some(function (p) { return !!selected[p]; });
        if (!anyParent) {
          skipped.push({ code: code, reason: 'parent SKU not selected' });
          return;
        }
      }
      lines.push(sku);
    });

    // Sort by displayOrder for stable presentation
    lines.sort(function (a, b) { return (a.displayOrder || 999) - (b.displayOrder || 999); });

    // Price each line
    var priced = lines.map(function (sku) {
      var price = priceLine(sku, segment, bracket, userCount);
      return {
        code: sku.code,
        name: sku.name,
        category: sku.category,
        timing: sku.timing,
        bundleEligible: !!sku.bundleEligible,
        unitDescription: price.unitDescription,
        billingNote: price.billingNote,
        lineAmountUsd: price.lineAmountUsd,
        isModule: isModule(sku)
      };
    });

    // Bundle discount calculation:
    // Count eligible modules (bundleEligible:true, isModule, not BETA - already filtered)
    var eligibleModules = priced.filter(function (l) { return l.bundleEligible && l.isModule; });
    var bundleEligibleCount = eligibleModules.length;
    var bundlePct = computeBundlePct(catalog, bundleEligibleCount);

    var eligibleSubtotal = eligibleModules.reduce(function (sum, l) { return sum + l.lineAmountUsd; }, 0);
    var bundleDiscountAmountUsd = eligibleSubtotal * (bundlePct / 100);

    // Recurring vs one-time totals
    var recurringSubtotal = priced
      .filter(function (l) { return l.timing === 'recurring'; })
      .reduce(function (sum, l) { return sum + l.lineAmountUsd; }, 0);

    var oneTimeSubtotal = priced
      .filter(function (l) { return l.timing === 'oneTime'; })
      .reduce(function (sum, l) { return sum + l.lineAmountUsd; }, 0);

    // Year 1 = recurring (with bundle discount applied) + one-time
    var year1Recurring = recurringSubtotal - bundleDiscountAmountUsd;

    // Multi-year continuity
    var myc = catalog.multiYearContinuity || { year1Pct: 0, year2Pct: 0, year3Pct: 0 };
    var year2Recurring = year1Recurring * (1 - (myc.year2Pct / 100));
    var year3Recurring = year1Recurring * (1 - (myc.year3Pct / 100));

    var contractYears = parseInt(draft.contractYears, 10) || 1;
    var tcv = year1Recurring + oneTimeSubtotal;
    if (contractYears >= 2) tcv += year2Recurring;
    if (contractYears >= 3) tcv += year3Recurring;

    return {
      generatedAt: new Date().toISOString(),
      catalogVersion: catalog.catalogVersion,
      proposalId: shortUuid(),

      input: {
        userCount: userCount,
        companySegment: segment ? segment.key : null,
        companySegmentLabel: segment ? segment.label : null,
        contractYears: contractYears,
        bracket: bracket ? bracket.label : null,
        bracketMultiplier: bracket ? bracket.multiplier : null
      },

      lines: priced,

      bundleDiscount: {
        eligibleModuleCount: bundleEligibleCount,
        eligibleSubtotalUsd: eligibleSubtotal,
        discountPct: bundlePct,
        discountAmountUsd: bundleDiscountAmountUsd
      },

      totals: {
        recurringListUsd: recurringSubtotal,
        recurringYear1Usd: year1Recurring,
        recurringYear2Usd: year2Recurring,
        recurringYear3Usd: year3Recurring,
        oneTimeUsd: oneTimeSubtotal,
        year1AnnualUsd: year1Recurring + oneTimeSubtotal,
        tcvUsd: tcv,
        contractYears: contractYears
      },

      multiYearContinuity: {
        year2Pct: myc.year2Pct,
        year3Pct: myc.year3Pct
      },

      skipped: skipped,
      errors: errors,
      hasErrors: errors.length > 0
    };
  }

  // ----------------------------------------------------------
  // Public surface
  // ----------------------------------------------------------
  window.TrendzactMath = {
    calculateProposal: calculateProposal,
    formatMoney: formatMoney,
    shortUuid: shortUuid,
    // expose helpers for testing
    _internals: {
      resolveSegment: resolveSegment,
      resolveBracket: resolveBracket,
      priceLine: priceLine,
      computeBundlePct: computeBundlePct
    }
  };
})();
