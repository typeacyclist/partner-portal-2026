// Trendzact Partners - Proposal Math Engine v7
//
// Pure-function math module. Reads catalog + draft, returns priced result.
// No DOM, no Firestore, no side effects — just deterministic calculation.
//
// Public API (attached to window.TrendzactMath):
//   calculateProposal(draft, catalog) -> CalculationResult
//   formatMoney(n) -> "$1,234,567"
//   shortUuid()    -> "TZ-XXXXXXXX"
//
// v7 Pricing Model:
//   1. Module-count pricing: uniform per-user MSRP base × moduleMultiplier[count] × commitFactor
//   2. Volume brackets: 6 tiers with MSRP bases (not multipliers off a single base)
//   3. Commitment tiers: flat annual, same price every year of term — factors
//      come from catalog.commitmentTiers (currently 1yr=100%, 2yr=90%, 3yr=80%).
//   4. CARE: direct MSRP lookup by segment (msrpBySegment), not multiplier-based
//   5. INIT-ONBRD: $10K base × presaleMultiplier (MSRP)
//   6. Per-user enhancements (UVA-WEBCAM, PRIVSCR): own MSRP bases with same volume ratios + commit tiers
//   7. Flat connectors: CONN-TEAMS $8K, CONN-PURVIEW $15K (no volume/commit scaling)
//   8. Channel: Trendzact net / Distributor retains / Reseller retains — derived from subdomain config
//
// Removed from v6:
//   - bundleDiscount (incentive baked into module-count curve)
//   - multiYearContinuity (replaced by commitment tiers)
//   - licenseCountBrackets (replaced by volumeBrackets with msrpBase)
//   - CORE SKU (absorbed into CARE)
//   - tieredByLicenseCount pricing model (replaced by moduleCount)
//   - flatPerUser pricing model (replaced by perUserVolume)

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

  // Per-unit prices need cent precision so "$X/user × N" visually reconciles
  // with the line total. Integer values stay clean ($96); any non-integer
  // gets exactly two decimals ($79.41 / $25.50) so currency looks complete.
  function formatPerUser(n) {
    if (n == null || isNaN(n)) return '$0';
    var num = Number(n);
    var hasFraction = Math.abs(num - Math.round(num)) > 0.005;
    return '$' + num.toLocaleString('en-US', {
      minimumFractionDigits: hasFraction ? 2 : 0,
      maximumFractionDigits: 2
    });
  }

  function shortUuid() {
    // Display-only proposal ID — 36^8 ≈ 2.8T possible values, so collisions are
    // unlikely at portal volume but this is NOT cryptographically unique.
    // Don't use the ID as an authorization token.
    var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var s = '';
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      var bytes = new Uint8Array(8);
      window.crypto.getRandomValues(bytes);
      for (var i = 0; i < 8; i++) s += alphabet[bytes[i] % alphabet.length];
    } else {
      for (var j = 0; j < 8; j++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return 'TZ-' + s;
  }

  function findSku(catalog, code) {
    var skus = catalog.skus || [];
    for (var i = 0; i < skus.length; i++) {
      if (skus[i].code === code) return skus[i];
    }
    return null;
  }

  function isRequired(sku) {
    var badges = (sku.selection && sku.selection.displayBadges) || [];
    return badges.indexOf('REQUIRED') !== -1;
  }

  function isModule(sku) {
    return sku.category === '10-Data Exposure Coverage';
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
  // Resolve volume bracket — returns bracket with msrpBase
  // ----------------------------------------------------------
  function resolveBracket(catalog, userCount) {
    var brackets = catalog.volumeBrackets || [];
    for (var i = 0; i < brackets.length; i++) {
      var b = brackets[i];
      if (b.maxUsers === null || userCount <= b.maxUsers) {
        return b;
      }
    }
    return brackets.length > 0 ? brackets[brackets.length - 1] : { msrpBase: 0, label: 'unknown' };
  }

  // ----------------------------------------------------------
  // Resolve commitment factor
  // ----------------------------------------------------------
  function resolveCommitFactor(catalog, years) {
    var tiers = catalog.commitmentTiers || [];
    for (var i = 0; i < tiers.length; i++) {
      if (tiers[i].years === years) return tiers[i].factor;
    }
    return 1.0; // default to 1yr if not found
  }

  // ----------------------------------------------------------
  // Resolve module multiplier
  // ----------------------------------------------------------
  function resolveModuleMultiplier(catalog, moduleCount) {
    var mults = catalog.moduleMultipliers || [1.0];
    var idx = Math.min(moduleCount, mults.length) - 1;
    if (idx < 0) return 0;
    return mults[idx];
  }

  // ----------------------------------------------------------
  // Channel discount calculations
  // ----------------------------------------------------------
  function resolveChannelConfig(catalog, subdomain) {
    var subs = catalog.subdomains || {};
    if (subdomain && subs[subdomain]) return subs[subdomain];
    // No matching subdomain → fall back to the catalog's defaultChannel
    // (INDIRECT two-tier model with standard distributor + reseller margins).
    if (catalog.defaultChannel) {
      var d = catalog.defaultChannel;
      return {
        label: d.label || 'INDIRECT',
        regularDistDiscount: d.regularDistDiscount || 0,
        regularResellerDiscount: d.regularResellerDiscount || 0,
        enhDistDiscount: d.enhDistDiscount || 0,
        enhResellerDiscount: d.enhResellerDiscount || 0,
        _default: true
      };
    }
    // Final hardcoded safety net if catalog.defaultChannel is missing.
    return {
      label: 'INDIRECT',
      regularDistDiscount: 0.4,
      regularResellerDiscount: 0.3,
      enhDistDiscount: 0.5,
      enhResellerDiscount: 0.35,
      _default: true
    };
  }

  function computeChannelPrices(msrp, discountGroup, channelConfig) {
    var distDiscount, resellerDiscount;
    if (discountGroup === 'enhancement') {
      distDiscount = channelConfig.enhDistDiscount != null ? channelConfig.enhDistDiscount : 0;
      resellerDiscount = channelConfig.enhResellerDiscount != null ? channelConfig.enhResellerDiscount : 0;
    } else {
      distDiscount = channelConfig.regularDistDiscount != null ? channelConfig.regularDistDiscount : 0;
      resellerDiscount = channelConfig.regularResellerDiscount != null ? channelConfig.regularResellerDiscount : 0;
    }

    var trendzactNet = msrp * (1 - distDiscount);
    var distributorSellsAt = msrp * (1 - resellerDiscount);
    var distributorRetains = distributorSellsAt - trendzactNet;
    var resellerRetains = msrp - distributorSellsAt;

    return {
      msrp: msrp,
      trendzactNet: trendzactNet,
      distributorPrice: distributorSellsAt,
      distributorRetains: distributorRetains,
      resellerRetains: resellerRetains,
      distDiscountPct: distDiscount,
      resellerDiscountPct: resellerDiscount
    };
  }

  // ----------------------------------------------------------
  // Compute single SKU line price (MSRP)
  // ----------------------------------------------------------
  function priceLine(sku, segment, bracket, userCount, moduleCount, commitFactor, catalog) {
    var p = sku.pricing;
    if (!p) {
      return { msrpPerUser: 0, msrpLine: 0, unitDescription: 'no pricing', billingNote: '' };
    }

    switch (p.model) {
      case 'moduleCount': {
        // Module pricing: the moduleMultiplier prices ALL modules as a bundle.
        // msrpBase × moduleMultiplier = total per-user cost for all modules combined.
        // Each individual module line gets an equal share: total / moduleCount.
        var modMult = resolveModuleMultiplier(catalog, moduleCount);
        var totalPerUser = bracket.msrpBase * modMult * commitFactor;
        var perLinePerUser = moduleCount > 0 ? totalPerUser / moduleCount : 0;
        return {
          msrpPerUser: perLinePerUser,
          msrpLine: perLinePerUser * userCount,
          _totalPerUser: totalPerUser,
          unitDescription: formatMoney(bracket.msrpBase) + ' base × ' + modMult.toFixed(2) + ' (' + moduleCount + ' mod) ÷ ' + moduleCount + ' × ' + commitFactor.toFixed(3) + ' commit = ' + formatMoney(perLinePerUser) + '/user/yr',
          billingNote: p.billableUnit + ' (' + bracket.label + ')'
        };
      }

      case 'perUserVolume': {
        // Per-user enhancement: own MSRP base at a reference bracket, scaled by
        // (current bracket msrpBase / reference bracket msrpBase) × commitFactor.
        // The reference bracket label lives on the SKU at pricing._refBracket
        // (e.g. "501-2,500 users"); we look up that bracket's msrpBase here.
        // If anything is missing or the bracket can't be matched, fall through
        // to the unscaled msrpBaseAtRef so a missing field doesn't zero the line.
        var enhMsrpAtRef = p.msrpBaseAtRef || p.msrpBase || 0;
        var refBracket = null;
        if (p._refBracket) {
          var allBrackets = catalog.volumeBrackets || [];
          for (var bi = 0; bi < allBrackets.length; bi++) {
            if (allBrackets[bi].label === p._refBracket) { refBracket = allBrackets[bi]; break; }
          }
        }
        var volRatio = (refBracket && refBracket.msrpBase) ? (bracket.msrpBase / refBracket.msrpBase) : 1;
        var enhMsrpScaled = enhMsrpAtRef * volRatio;
        var enhPerUser = enhMsrpScaled * commitFactor;
        return {
          msrpPerUser: enhPerUser,
          msrpLine: enhPerUser * userCount,
          unitDescription: formatMoney(enhMsrpAtRef) + ' ref × ' + volRatio.toFixed(3) + ' vol × ' + commitFactor.toFixed(3) + ' commit = ' + formatMoney(enhPerUser) + '/user/yr',
          billingNote: p.billableUnit + ' (' + bracket.label + ')'
        };
      }

      case 'flat': {
        return {
          msrpPerUser: 0,
          msrpLine: p.amountUsd,
          unitDescription: formatMoney(p.amountUsd) + ' flat/yr',
          billingNote: p.billableUnit
        };
      }

      case 'tieredByCompanySize': {
        if (!segment) {
          return { msrpPerUser: 0, msrpLine: 0, unitDescription: 'segment unresolved', billingNote: '' };
        }
        // CARE uses msrpBySegment direct lookup if available
        if (p.msrpBySegment && p.msrpBySegment[segment.key] !== undefined) {
          var careAmount = p.msrpBySegment[segment.key];
          return {
            msrpPerUser: 0,
            msrpLine: careAmount,
            unitDescription: formatMoney(careAmount) + ' (' + segment.label + ')',
            billingNote: p.billableUnit + ' (' + segment.label + ')'
          };
        }
        // Fallback: base × multiplier (for INIT-ONBRD)
        var mult = segment[p.multiplierRef] || 1;
        var amt = p.baseAmountUsd * mult;
        return {
          msrpPerUser: 0,
          msrpLine: amt,
          unitDescription: formatMoney(p.baseAmountUsd) + ' base × ' + mult.toFixed(2) + ' = ' + formatMoney(amt),
          billingNote: p.billableUnit + ' (' + segment.label + ')'
        };
      }

      default:
        return { msrpPerUser: 0, msrpLine: 0, unitDescription: 'unknown model: ' + p.model, billingNote: '' };
    }
  }

  // ----------------------------------------------------------
  // Main: calculateProposal
  // ----------------------------------------------------------
  function calculateProposal(draft, catalog) {
    var errors = [];

    if (!catalog || !catalog.skus) {
      errors.push('Catalog missing or invalid.');
      return { errors: errors, hasErrors: true };
    }
    if (!draft) {
      errors.push('Draft is missing.');
      return { errors: errors, hasErrors: true };
    }

    // Resolve segment
    var segment = resolveSegment(catalog, draft.companySegment);
    if (!segment) {
      errors.push('Unknown company segment: ' + draft.companySegment);
    }

    // User count
    var userCount = parseInt(draft.userCount, 10) || 0;
    if (userCount <= 0) {
      errors.push('User count must be greater than 0.');
    }

    // Resolve bracket
    var bracket = resolveBracket(catalog, userCount);

    // Contract term and commitment factor
    var contractYears = parseInt(draft.contractYears, 10) || 1;
    var commitFactor = resolveCommitFactor(catalog, contractYears);

    // Subdomain for channel pricing
    var subdomain = draft.subdomain || '';
    var channelConfig = resolveChannelConfig(catalog, subdomain);

    // Per-line quantity overrides (keyed by SKU code). Optional: when absent,
    // every line uses its natural quantity and totals are unchanged. Per-user
    // lines default to userCount; flat lines default to 1.
    // CARE (core services SLA) and INIT-ONBRD (onboarding) are quantity-locked:
    // their pricing is per-contract, not per-unit, so any override is ignored.
    var qtyOverrides = draft.qtyOverrides || {};
    var QTY_LOCKED = { CARE: true, 'INIT-ONBRD': true };

    // Build set of selected codes (manual selections + REQUIRED auto-includes)
    var selected = {};
    (draft.selectedSkuCodes || []).forEach(function (c) { selected[c] = true; });

    // Auto-include all REQUIRED skus
    catalog.skus.forEach(function (sku) {
      if (isRequired(sku) && sku.isActive) {
        selected[sku.code] = true;
      }
    });

    // Count selected modules (for moduleMultiplier lookup)
    var moduleCount = 0;
    Object.keys(selected).forEach(function (code) {
      var sku = findSku(catalog, code);
      if (sku && sku.isActive && isModule(sku)) {
        moduleCount++;
      }
    });

    // Filter selection: only include skus that exist + are active
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

    // Sort by displayOrder
    lines.sort(function (a, b) { return (a.displayOrder || 999) - (b.displayOrder || 999); });

    // Price each line
    var priced = lines.map(function (sku) {
      var price = priceLine(sku, segment, bracket, userCount, moduleCount, commitFactor, catalog);

      // Quantity model: per-user lines bill unitMsrp (= $/user) × userCount;
      // flat lines bill unitMsrp (= the whole line) × 1. An override replaces
      // the quantity; the line total and channel split scale from it.
      var perUser = price.msrpPerUser > 0;
      var unitMsrp = perUser ? price.msrpPerUser : price.msrpLine;
      var naturalQty = perUser ? userCount : 1;
      var ov = QTY_LOCKED[sku.code] ? undefined : qtyOverrides[sku.code];
      var qty = (ov === undefined || ov === null || ov === '' || isNaN(ov))
          ? naturalQty
          : Math.max(0, parseInt(ov, 10));
      var msrpLine = unitMsrp * qty;

      var channel = computeChannelPrices(msrpLine, sku.discountGroup || 'regular', channelConfig);
      return {
        code: sku.code,
        name: sku.name,
        category: sku.category,
        timing: sku.timing,
        discountGroup: sku.discountGroup || 'regular',
        isModule: isModule(sku),
        msrpPerUser: price.msrpPerUser,
        unitMsrp: unitMsrp,
        qty: qty,
        naturalQty: naturalQty,
        qtyLocked: !!QTY_LOCKED[sku.code],
        qtyOverridden: qty !== naturalQty,
        msrpLine: msrpLine,
        unitDescription: price.unitDescription,
        billingNote: price.billingNote,
        channel: channel
      };
    });

    // Totals by timing
    var recurringMsrp = 0;
    var recurringTrendzactNet = 0;
    var recurringDistRetains = 0;
    var recurringResellerRetains = 0;
    var oneTimeMsrp = 0;
    var oneTimeTrendzactNet = 0;
    var oneTimeDistRetains = 0;
    var oneTimeResellerRetains = 0;

    priced.forEach(function (l) {
      if (l.timing === 'recurring') {
        recurringMsrp += l.msrpLine;
        recurringTrendzactNet += l.channel.trendzactNet;
        recurringDistRetains += l.channel.distributorRetains;
        recurringResellerRetains += l.channel.resellerRetains;
      } else if (l.timing === 'oneTime') {
        oneTimeMsrp += l.msrpLine;
        oneTimeTrendzactNet += l.channel.trendzactNet;
        oneTimeDistRetains += l.channel.distributorRetains;
        oneTimeResellerRetains += l.channel.resellerRetains;
      }
    });

    // Annual = recurring (commitment already applied per-line)
    // TCV = annual recurring × contractYears + one-time
    var annualMsrp = recurringMsrp;
    var tcvMsrp = annualMsrp * contractYears + oneTimeMsrp;

    var annualTrendzactNet = recurringTrendzactNet;
    var tcvTrendzactNet = annualTrendzactNet * contractYears + oneTimeTrendzactNet;

    var annualDistRetains = recurringDistRetains;
    var tcvDistRetains = annualDistRetains * contractYears + oneTimeDistRetains;

    var annualResellerRetains = recurringResellerRetains;
    var tcvResellerRetains = annualResellerRetains * contractYears + oneTimeResellerRetains;

    // Module multiplier info for display
    var modMult = resolveModuleMultiplier(catalog, moduleCount);

    return {
      generatedAt: new Date().toISOString(),
      catalogVersion: catalog.catalogVersion,
      proposalId: shortUuid(),

      input: {
        userCount: userCount,
        companySegment: segment ? segment.key : null,
        companySegmentLabel: segment ? segment.label : null,
        contractYears: contractYears,
        commitFactor: commitFactor,
        bracket: bracket ? bracket.label : null,
        bracketMsrpBase: bracket ? bracket.msrpBase : null,
        moduleCount: moduleCount,
        moduleMultiplier: modMult,
        subdomain: subdomain || null
      },

      lines: priced,

      totals: {
        // MSRP (customer-facing)
        annualRecurringMsrp: annualMsrp,
        oneTimeMsrp: oneTimeMsrp,
        year1Msrp: annualMsrp + oneTimeMsrp,
        tcvMsrp: tcvMsrp,

        // Channel breakdown
        annualTrendzactNet: annualTrendzactNet,
        annualDistRetains: annualDistRetains,
        annualResellerRetains: annualResellerRetains,

        tcvTrendzactNet: tcvTrendzactNet,
        tcvDistRetains: tcvDistRetains,
        tcvResellerRetains: tcvResellerRetains,

        // One-time channel
        oneTimeTrendzactNet: oneTimeTrendzactNet,
        oneTimeDistRetains: oneTimeDistRetains,
        oneTimeResellerRetains: oneTimeResellerRetains,

        contractYears: contractYears
      },

      commitment: {
        years: contractYears,
        factor: commitFactor,
        label: (catalog.commitmentTiers || []).reduce(function (acc, t) {
          return t.years === contractYears ? t.label : acc;
        }, contractYears + '-year')
      },

      skipped: skipped,
      errors: errors,
      hasErrors: errors.length > 0
    };
  }

  // ----------------------------------------------------------
  // Convenience: calculate for all 3 commitment tiers at once
  // ----------------------------------------------------------
  function calculateAllTiers(draft, catalog) {
    var tiers = catalog.commitmentTiers || [{ years: 1 }, { years: 2 }, { years: 3 }];
    return tiers.map(function (tier) {
      var d = Object.assign({}, draft, { contractYears: tier.years });
      return calculateProposal(d, catalog);
    });
  }

  // ----------------------------------------------------------
  // Public surface
  // ----------------------------------------------------------
  window.TrendzactMath = {
    calculateProposal: calculateProposal,
    calculateAllTiers: calculateAllTiers,
    formatMoney: formatMoney,
    formatPerUser: formatPerUser,
    shortUuid: shortUuid,
    resolveChannelConfig: resolveChannelConfig,
    _internals: {
      resolveSegment: resolveSegment,
      resolveBracket: resolveBracket,
      resolveModuleMultiplier: resolveModuleMultiplier,
      resolveCommitFactor: resolveCommitFactor,
      resolveChannelConfig: resolveChannelConfig,
      computeChannelPrices: computeChannelPrices,
      priceLine: priceLine
    }
  };
})();