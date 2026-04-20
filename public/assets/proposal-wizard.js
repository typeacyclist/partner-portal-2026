// Trendzact Partners - Proposal Wizard
//
// Track D implementation: 4-step wizard at /proposal that drives the math
// engine and PDF renderer. Drafts persist to Firestore at users/{uid}/activeProposal/current.
//
// Public surface:
//   - Page calls window.TrendzactWizard.init() after auth-ready event
//   - Wizard owns the form state, step nav, SKU card rendering, and the
//     autosave loop. It calls into TrendzactMath for calculation and
//     TrendzactProposalRender for PDF generation.

(function () {
  'use strict';

  // -----------------------------------------------------------
  // State
  // -----------------------------------------------------------
  var state = {
    catalog: null,
    user: null,
    db: null,
    draft: emptyDraft(),
    currentStep: 1,
    saveTimer: null,
    isSaving: false,
    lastSaveAt: null,
    docRef: null,        // Firestore doc reference
    initialized: false,
    fsModule: null       // Lazy-loaded firestore module
  };

  function emptyDraft() {
    return {
      // Step 1
      companyName: '',
      contactName: '',
      primaryUseCase: '',
      dealStage: 'Discovery',
      estimatedCloseDate: '',
      companySegment: 'core_midmkt',
      userCount: 1000,
      contractYears: 1,
      // Step 2
      selectedSkuCodes: [],     // codes only; REQUIRED auto-included by math engine
      // Step 4
      notes: '',
      // Meta
      updatedAt: null,
      createdAt: null
    };
  }

  // -----------------------------------------------------------
  // Init
  // -----------------------------------------------------------
  async function init() {
    if (state.initialized) return;
    state.initialized = true;

    // Wait for auth, fetch catalog in parallel
    var authReadyPromise = new Promise(function (resolve) {
      if (window.TrendzactAuth && window.TrendzactAuth.currentUser) {
        resolve(window.TrendzactAuth.currentUser);
      } else {
        window.addEventListener('trendzact-auth-ready', function (e) {
          resolve(e.detail.user);
        }, { once: true });
      }
    });

    var catalogPromise = fetch('/catalog.json', { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('Catalog HTTP ' + r.status);
        return r.json();
      });

    try {
      var pair = await Promise.all([authReadyPromise, catalogPromise]);
      state.user = pair[0];
      state.catalog = pair[1];
      state.db = window.TrendzactAuth.db;
    } catch (e) {
      renderFatalError('Could not load proposal builder: ' + e.message);
      return;
    }

    // Load Firestore module (dynamic import - keeps initial page light if not used)
    try {
      state.fsModule = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
      state.docRef = state.fsModule.doc(state.db, 'users', state.user.uid, 'activeProposal', 'current');
    } catch (e) {
      console.warn('[Wizard] Firestore module load failed; running without persistence', e);
    }

    // Try to resume an existing draft
    var existingDraft = null;
    if (state.docRef) {
      try {
        var snap = await state.fsModule.getDoc(state.docRef);
        if (snap.exists()) existingDraft = snap.data();
      } catch (e) {
        console.warn('[Wizard] Could not load existing draft', e);
      }
    }

    if (existingDraft && existingDraft.companyName) {
      // Show resume modal
      showResumeModal(existingDraft);
    } else {
      startFresh();
    }
  }

  function showResumeModal(existingDraft) {
    var modal = document.createElement('div');
    modal.className = 'wiz-modal-backdrop';
    modal.innerHTML =
      '<div class="wiz-modal">' +
        '<h3>Continue where you left off?</h3>' +
        '<p>You have an in-progress proposal for <strong>' + escapeHtml(existingDraft.companyName) + '</strong>' +
          (existingDraft.updatedAt ? ' (last saved ' + formatTimeAgo(existingDraft.updatedAt) + ')' : '') + '.</p>' +
        '<div class="wiz-modal-actions">' +
          '<button type="button" class="btn btn-ghost" data-act="fresh">Start fresh</button>' +
          '<button type="button" class="btn btn-primary" data-act="resume">Continue</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', function (e) {
      var t = e.target;
      if (t.dataset.act === 'resume') {
        // Merge existing draft into state, fill missing keys with defaults
        var merged = emptyDraft();
        Object.keys(existingDraft).forEach(function (k) {
          if (k in merged) merged[k] = existingDraft[k];
        });
        state.draft = merged;
        modal.remove();
        renderShell();
        gotoStep(1);
      } else if (t.dataset.act === 'fresh') {
        modal.remove();
        confirmFresh();
      }
    });
  }

  function confirmFresh() {
    if (!confirm('Start a new proposal? Your current draft will be cleared.')) {
      // Bring resume modal back
      // Re-fetch the existing draft snap then show modal again
      state.fsModule.getDoc(state.docRef).then(function (snap) {
        if (snap.exists()) showResumeModal(snap.data());
        else startFresh();
      });
      return;
    }
    state.draft = emptyDraft();
    persistDraft();
    renderShell();
    gotoStep(1);
  }

  function startFresh() {
    state.draft = emptyDraft();
    state.draft.createdAt = new Date().toISOString();
    renderShell();
    gotoStep(1);
  }

  // -----------------------------------------------------------
  // Persistence
  // -----------------------------------------------------------
  function scheduleAutosave() {
    if (state.saveTimer) clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(persistDraft, 1500);
  }

  async function persistDraft() {
    state.draft.updatedAt = new Date().toISOString();
    if (!state.draft.createdAt) state.draft.createdAt = state.draft.updatedAt;

    updateSaveIndicator('saving');
    if (!state.docRef) {
      // No Firestore - just mark as saved-local
      state.lastSaveAt = state.draft.updatedAt;
      updateSaveIndicator('saved');
      return;
    }
    state.isSaving = true;
    try {
      await state.fsModule.setDoc(state.docRef, state.draft, { merge: true });
      state.lastSaveAt = state.draft.updatedAt;
      updateSaveIndicator('saved');
    } catch (e) {
      console.error('[Wizard] autosave failed', e);
      updateSaveIndicator('error');
    } finally {
      state.isSaving = false;
    }
  }

  async function clearDraftDoc() {
    if (!state.docRef) return;
    try {
      await state.fsModule.deleteDoc(state.docRef);
    } catch (e) {
      console.warn('[Wizard] clearing draft failed', e);
    }
  }

  function updateSaveIndicator(stateName) {
    var el = document.getElementById('wiz-save-indicator');
    if (!el) return;
    var labels = {
      saving: '<span class="wiz-dot wiz-dot-amber"></span> Saving…',
      saved:  '<span class="wiz-dot wiz-dot-green"></span> Saved',
      error:  '<span class="wiz-dot wiz-dot-red"></span> Save failed'
    };
    el.innerHTML = labels[stateName] || '';
  }

  // -----------------------------------------------------------
  // Render shell + stepper
  // -----------------------------------------------------------
  function renderShell() {
    var mount = document.getElementById('wizard-mount');
    if (!mount) return;
    mount.innerHTML =
      '<div class="wiz-stepper" id="wiz-stepper">' + renderStepper() + '</div>' +
      '<div class="wiz-step-body" id="wiz-step-body"></div>' +
      '<div class="wiz-nav-bar">' +
        '<div id="wiz-save-indicator" class="wiz-save-indicator"></div>' +
        '<div class="wiz-nav-buttons">' +
          '<button type="button" class="btn btn-ghost" id="wiz-back" style="display:none;">← Back</button>' +
          '<button type="button" class="btn btn-primary" id="wiz-next">Next →</button>' +
        '</div>' +
      '</div>' +
      '<div id="wiz-status" class="wiz-status" style="display:none;"></div>';

    document.getElementById('wiz-back').addEventListener('click', function () { gotoStep(state.currentStep - 1); });
    document.getElementById('wiz-next').addEventListener('click', function () { onNext(); });
  }

  function renderStepper() {
    var steps = [
      { num: 1, label: 'Opportunity' },
      { num: 2, label: 'Modules' },
      { num: 3, label: 'Review' },
      { num: 4, label: 'Render' }
    ];
    return steps.map(function (s) {
      var cls = 'wiz-step' + (s.num === state.currentStep ? ' active' : '') + (s.num < state.currentStep ? ' done' : '');
      return '<div class="' + cls + '" data-step="' + s.num + '">' +
               '<span class="wiz-step-num">' + s.num + '</span>' +
               '<span class="wiz-step-label">' + s.label + '</span>' +
             '</div>';
    }).join('<div class="wiz-step-sep"></div>');
  }

  function gotoStep(n) {
    if (n < 1 || n > 4) return;
    state.currentStep = n;
    document.getElementById('wiz-stepper').innerHTML = renderStepper();
    document.getElementById('wiz-back').style.display = n > 1 ? '' : 'none';
    var nextBtn = document.getElementById('wiz-next');
    if (n === 4) {
      nextBtn.style.display = 'none';
    } else if (n === 3) {
      nextBtn.style.display = '';
      nextBtn.textContent = 'Render Proposal →';
    } else {
      nextBtn.style.display = '';
      nextBtn.textContent = 'Next →';
    }
    var body = document.getElementById('wiz-step-body');
    if (n === 1) renderStep1(body);
    else if (n === 2) renderStep2(body);
    else if (n === 3) renderStep3(body);
    else if (n === 4) renderStep4(body);
    document.getElementById('wiz-status').style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function onNext() {
    if (state.currentStep === 1) {
      var err = validateStep1();
      if (err) { showStatus(err, 'error'); return; }
      gotoStep(2);
    } else if (state.currentStep === 2) {
      gotoStep(3);
    } else if (state.currentStep === 3) {
      // Render Proposal
      onRender();
    }
  }

  // -----------------------------------------------------------
  // Step 1 - Opportunity
  // -----------------------------------------------------------
  function renderStep1(body) {
    var d = state.draft;
    body.innerHTML =
      '<h2 class="wiz-h2">Opportunity</h2>' +
      '<p class="wiz-sub">Capture the prospect details. Company segment and licensed user count drive pricing.</p>' +
      '<div class="form-grid">' +
        field('Company Name *', 'company-name', 'text', d.companyName, 'e.g. Acme Financial Services', true) +
        field('Contact Name', 'contact-name', 'text', d.contactName, 'First and last name') +
        field('Primary Use Case', 'primary-use-case', 'text', d.primaryUseCase, 'e.g. Insider Threat Detection', false, 'full') +
        selectField('Deal Stage', 'deal-stage', d.dealStage, [
          'Discovery', 'Qualification', 'Technical Evaluation', 'Business Case',
          'Proposal', 'Negotiation', 'Closed Won'
        ]) +
        field('Estimated Close Date', 'close-date', 'date', d.estimatedCloseDate, '') +
        segmentField(d.companySegment) +
        field('Licensed Users', 'user-count', 'number', d.userCount, 'e.g. 1000') +
        contractYearsField(d.contractYears) +
      '</div>';

    body.querySelectorAll('input, select').forEach(function (el) {
      el.addEventListener('input', onStep1Input);
      el.addEventListener('change', onStep1Input);
    });
  }

  function field(label, id, type, value, ph, isFull, full) {
    var cls = 'form-field' + (full === 'full' ? ' full' : '');
    var safe = value == null ? '' : String(value).replace(/"/g, '&quot;');
    return '<div class="' + cls + '">' +
           '<label for="' + id + '">' + label + '</label>' +
           '<input id="' + id + '" type="' + type + '" value="' + safe + '" placeholder="' + (ph || '') + '" />' +
           '</div>';
  }

  function selectField(label, id, value, options) {
    var opts = options.map(function (o) {
      var sel = (o === value) ? ' selected' : '';
      return '<option value="' + escapeHtml(o) + '"' + sel + '>' + escapeHtml(o) + '</option>';
    }).join('');
    return '<div class="form-field">' +
           '<label for="' + id + '">' + label + '</label>' +
           '<select id="' + id + '">' + opts + '</select>' +
           '</div>';
  }

  function segmentField(value) {
    var opts = state.catalog.companySizeSegments.map(function (s) {
      var sel = (s.key === value) ? ' selected' : '';
      return '<option value="' + s.key + '"' + sel + '>' + escapeHtml(s.label) + ' (' + s.headcountRange + ')</option>';
    }).join('');
    return '<div class="form-field">' +
           '<label for="segment">Company Segment</label>' +
           '<select id="segment">' + opts + '</select>' +
           '</div>';
  }

  function contractYearsField(value) {
    return '<div class="form-field">' +
           '<label for="contract-years">Contract Length</label>' +
           '<select id="contract-years">' +
             '<option value="1"' + (value === 1 ? ' selected' : '') + '>1 year</option>' +
             '<option value="2"' + (value === 2 ? ' selected' : '') + '>2 years</option>' +
             '<option value="3"' + (value === 3 ? ' selected' : '') + '>3 years</option>' +
           '</select>' +
           '</div>';
  }

  function onStep1Input() {
    var g = function (id) { return document.getElementById(id); };
    var d = state.draft;
    d.companyName = g('company-name').value.trim();
    d.contactName = g('contact-name').value.trim();
    d.primaryUseCase = g('primary-use-case').value.trim();
    d.dealStage = g('deal-stage').value;
    d.estimatedCloseDate = g('close-date').value;
    d.companySegment = g('segment').value;
    d.userCount = parseInt(g('user-count').value, 10) || 0;
    d.contractYears = parseInt(g('contract-years').value, 10) || 1;
    scheduleAutosave();
  }

  function validateStep1() {
    if (!state.draft.companyName) return 'Please enter a Company Name.';
    if (!state.draft.userCount || state.draft.userCount < 1) return 'Please enter a positive Licensed Users count.';
    return null;
  }

  // -----------------------------------------------------------
  // Step 2 - Modules
  // -----------------------------------------------------------
  function renderStep2(body) {
    var html = '<h2 class="wiz-h2">Modules &amp; Add-Ons</h2>';
    html += '<p class="wiz-sub">Select modules and any optional add-ons. CORE, CARE, and Initialization are always included.</p>';

    // Always-included summary
    html += '<div class="wiz-included">';
    html += '<h4>Always Included</h4>';
    html += '<div class="wiz-included-list">';
    state.catalog.skus.forEach(function (s) {
      var badges = (s.selection && s.selection.displayBadges) || [];
      if (badges.indexOf('REQUIRED') !== -1) {
        html += '<div class="wiz-included-item">' +
                  '<span class="wiz-badge wiz-badge-required">REQUIRED</span> ' +
                  '<strong>' + escapeHtml(s.code) + '</strong> ' + escapeHtml(s.name) +
                '</div>';
      }
    });
    html += '</div></div>';

    // Modules section
    html += '<h3 class="wiz-h3">Modules</h3>';
    html += '<div class="wiz-sku-grid">';
    var modules = state.catalog.skus
      .filter(function (s) { return s.category === '10-Module' && s.isActive; })
      .sort(function (a, b) { return a.displayOrder - b.displayOrder; });
    modules.forEach(function (m) { html += renderSkuCard(m); });
    html += '</div>';

    // Platform options
    html += '<h3 class="wiz-h3">Platform Options</h3>';
    html += '<div class="wiz-sku-grid wiz-sku-grid-compact">';
    state.catalog.skus
      .filter(function (s) { return s.category === '25-Platform Option Recurring' && s.isActive; })
      .sort(function (a, b) { return a.displayOrder - b.displayOrder; })
      .forEach(function (s) { html += renderSkuCard(s); });
    html += '</div>';

    // One-time integrations
    html += '<h3 class="wiz-h3">One-Time Setup &amp; Integrations</h3>';
    html += '<div class="wiz-sku-grid wiz-sku-grid-compact">';
    state.catalog.skus
      .filter(function (s) { return s.category === '30-Setup/Integration Option' && s.isActive; })
      .sort(function (a, b) { return a.displayOrder - b.displayOrder; })
      .forEach(function (s) {
        var badges = (s.selection && s.selection.displayBadges) || [];
        if (badges.indexOf('REQUIRED') !== -1) return;  // Already shown in always-included
        html += renderSkuCard(s);
      });
    html += '</div>';

    body.innerHTML = html;

    body.querySelectorAll('input[type=checkbox][data-sku]').forEach(function (cb) {
      cb.addEventListener('change', onSkuToggle);
    });
  }

  function renderSkuCard(sku) {
    var sel = sku.selection || {};
    var badges = sel.displayBadges || [];
    var isBeta = badges.indexOf('BETA') !== -1;
    var isNewGa = badges.indexOf('NEW GA') !== -1;
    var checked = state.draft.selectedSkuCodes.indexOf(sku.code) !== -1;

    // Conditional skus: only render if parent is selected
    if (sel.mode === 'conditional' && Array.isArray(sel.parentCodes)) {
      var anyParent = sel.parentCodes.some(function (p) {
        return state.draft.selectedSkuCodes.indexOf(p) !== -1;
      });
      if (!anyParent) return '';
    }

    var priceLabel = priceSummaryFor(sku);

    var badgeHtml = '';
    if (isBeta) badgeHtml = '<span class="wiz-badge wiz-badge-beta">BETA</span>';
    else if (isNewGa) badgeHtml = '<span class="wiz-badge wiz-badge-newga">NEW GA</span>';

    var inputAttrs = 'data-sku="' + sku.code + '"';
    if (isBeta) inputAttrs += ' disabled';
    if (checked && !isBeta) inputAttrs += ' checked';

    var tooltip = isBeta ? ' title="In BETA. Not yet available for new deployments."' : '';

    var features = '';
    var feats = sku.features && sku.features.included;
    if (feats && feats.length) {
      features = '<ul class="wiz-feature-list">' +
                   feats.map(function (f) { return '<li>' + escapeHtml(f) + '</li>'; }).join('') +
                 '</ul>';
    }

    // Optional add-ons (children) - render below as nested cards if parent is selected
    var nested = '';
    var addons = (sku.features && sku.features.optionalAddOns) || [];
    if (addons.length && checked && !isBeta) {
      nested = '<div class="wiz-nested">';
      nested += '<div class="wiz-nested-label">Optional add-ons:</div>';
      var anyRendered = false;
      addons.forEach(function (code) {
        var child = findSku(code);
        if (!child || !child.isActive) return;
        var childCard = renderSkuCard(child);
        if (childCard) { nested += childCard; anyRendered = true; }
      });
      if (!anyRendered) {
        nested += '<div class="wiz-nested-empty">None needed</div>';
      }
      nested += '</div>';
    }

    return (
      '<label class="wiz-sku-card' + (isBeta ? ' wiz-sku-beta' : '') + (checked && !isBeta ? ' wiz-sku-checked' : '') + '"' + tooltip + '>' +
        '<div class="wiz-sku-head">' +
          '<input type="checkbox" ' + inputAttrs + ' />' +
          '<div class="wiz-sku-title-block">' +
            '<div class="wiz-sku-title-row">' +
              '<strong class="wiz-sku-name">' + escapeHtml(sku.name) + '</strong>' +
              badgeHtml +
            '</div>' +
            '<div class="wiz-sku-code">' + escapeHtml(sku.code) + ' &middot; ' + priceLabel + '</div>' +
          '</div>' +
        '</div>' +
        '<p class="wiz-sku-desc">' + escapeHtml(sku.description || '') + '</p>' +
        features +
      '</label>' + nested
    );
  }

  function priceSummaryFor(sku) {
    var p = sku.pricing;
    if (!p) return 'Pricing TBD';
    if (p.model === 'flat') return TrendzactMath.formatMoney(p.amountUsd) + '/yr';
    if (p.model === 'flatPerUser') return TrendzactMath.formatMoney(p.amountUsdPerUser) + '/user/yr';
    if (p.model === 'tieredByLicenseCount') return 'from ' + TrendzactMath.formatMoney(p.baseAmountUsdPerUser) + '/user/yr';
    if (p.model === 'tieredByCompanySize') return 'from ' + TrendzactMath.formatMoney(p.baseAmountUsd) + '/yr';
    return '';
  }

  function findSku(code) {
    for (var i = 0; i < state.catalog.skus.length; i++) {
      if (state.catalog.skus[i].code === code) return state.catalog.skus[i];
    }
    return null;
  }

  function onSkuToggle(e) {
    var code = e.target.dataset.sku;
    var idx = state.draft.selectedSkuCodes.indexOf(code);
    if (e.target.checked && idx === -1) {
      state.draft.selectedSkuCodes.push(code);
    } else if (!e.target.checked && idx !== -1) {
      state.draft.selectedSkuCodes.splice(idx, 1);
      // Cascade: also deselect any conditional children whose only parent we just removed
      var children = state.catalog.skus.filter(function (s) {
        var sel = s.selection || {};
        return sel.mode === 'conditional' &&
               Array.isArray(sel.parentCodes) &&
               sel.parentCodes.indexOf(code) !== -1;
      });
      children.forEach(function (c) {
        var sel = c.selection || {};
        var stillHasParent = sel.parentCodes.some(function (p) {
          return state.draft.selectedSkuCodes.indexOf(p) !== -1;
        });
        if (!stillHasParent) {
          var ci = state.draft.selectedSkuCodes.indexOf(c.code);
          if (ci !== -1) state.draft.selectedSkuCodes.splice(ci, 1);
        }
      });
    }
    scheduleAutosave();
    // Re-render whole step so nested cards appear/disappear
    var body = document.getElementById('wiz-step-body');
    renderStep2(body);
  }

  // -----------------------------------------------------------
  // Step 3 - Review
  // -----------------------------------------------------------
  function renderStep3(body) {
    var result = TrendzactMath.calculateProposal(state.draft, state.catalog);
    state._lastCalc = result;

    var fmt = TrendzactMath.formatMoney;
    var html = '<h2 class="wiz-h2">Review &amp; Calculate</h2>';
    html += '<p class="wiz-sub">Review pricing and notes. Click Render Proposal to generate the PDF.</p>';

    if (result.errors && result.errors.length) {
      html += '<div class="wiz-error-box"><strong>Cannot calculate:</strong><ul>';
      result.errors.forEach(function (e) { html += '<li>' + escapeHtml(e) + '</li>'; });
      html += '</ul></div>';
    }

    // Summary header
    html += '<div class="wiz-review-grid">';
    html += '<div class="wiz-review-meta">';
    html += '<table class="wiz-meta-table">' +
              row('Company',       state.draft.companyName) +
              row('Contact',       state.draft.contactName || '—') +
              row('Use case',      state.draft.primaryUseCase || '—') +
              row('Stage',         state.draft.dealStage) +
              row('Close',         state.draft.estimatedCloseDate || '—') +
              row('Segment',       result.input.companySegmentLabel || '—') +
              row('Users',         (result.input.userCount || 0).toLocaleString('en-US')) +
              row('Volume bracket',(result.input.bracket || '—') + ' (×' + (result.input.bracketMultiplier || 1).toFixed(2) + ')') +
              row('Contract',      state.draft.contractYears + ' year(s)') +
            '</table>';
    html += '</div>';

    // Totals card
    html += '<div class="wiz-totals-card">';
    html += '<div class="wiz-totals-label">YEAR 1 TOTAL</div>';
    html += '<div class="wiz-totals-big">' + fmt(result.totals.year1AnnualUsd) + '</div>';
    html += '<div class="wiz-totals-grid">';
    html += '<div><span>Recurring (list)</span><strong>' + fmt(result.totals.recurringListUsd) + '</strong></div>';
    if (result.bundleDiscount.discountAmountUsd > 0) {
      html += '<div class="wiz-totals-discount"><span>Bundle discount (' + result.bundleDiscount.discountPct + '%)</span><strong>−' + fmt(result.bundleDiscount.discountAmountUsd) + '</strong></div>';
    }
    html += '<div><span>Recurring Y1 (after discount)</span><strong>' + fmt(result.totals.recurringYear1Usd) + '</strong></div>';
    html += '<div><span>One-time</span><strong>' + fmt(result.totals.oneTimeUsd) + '</strong></div>';
    if (state.draft.contractYears >= 2) {
      html += '<div class="wiz-totals-sep"></div>';
      html += '<div><span>Year 2 recurring (' + (100 - result.multiYearContinuity.year2Pct) + '%)</span><strong>' + fmt(result.totals.recurringYear2Usd) + '</strong></div>';
    }
    if (state.draft.contractYears >= 3) {
      html += '<div><span>Year 3 recurring (' + (100 - result.multiYearContinuity.year3Pct) + '%)</span><strong>' + fmt(result.totals.recurringYear3Usd) + '</strong></div>';
    }
    if (state.draft.contractYears > 1) {
      html += '<div class="wiz-totals-tcv"><span>TCV (' + state.draft.contractYears + ' yr)</span><strong>' + fmt(result.totals.tcvUsd) + '</strong></div>';
    }
    html += '</div></div>';
    html += '</div>';

    // Line items table
    html += '<h3 class="wiz-h3">Line Items</h3>';
    html += '<table class="wiz-line-table">';
    html += '<thead><tr><th>SKU</th><th>Description</th><th>Unit</th><th class="r">Annual</th></tr></thead><tbody>';
    result.lines.forEach(function (l) {
      var tag = l.timing === 'oneTime' ? ' <span class="wiz-pill">one-time</span>' : '';
      html += '<tr>' +
                '<td><code>' + escapeHtml(l.code) + '</code></td>' +
                '<td>' + escapeHtml(l.name) + tag + '</td>' +
                '<td>' + escapeHtml(l.unitDescription) + '</td>' +
                '<td class="r">' + fmt(l.lineAmountUsd) + '</td>' +
              '</tr>';
    });
    html += '</tbody></table>';

    // Notes
    html += '<h3 class="wiz-h3">Proposal Notes (optional)</h3>';
    html += '<textarea id="wiz-notes" class="wiz-notes-input" placeholder="Context, compliance drivers, competitive landscape, special terms…">' + escapeHtml(state.draft.notes || '') + '</textarea>';

    body.innerHTML = html;
    document.getElementById('wiz-notes').addEventListener('input', function (e) {
      state.draft.notes = e.target.value;
      scheduleAutosave();
    });
  }

  function row(k, v) {
    return '<tr><th>' + escapeHtml(k) + '</th><td>' + escapeHtml(String(v)) + '</td></tr>';
  }

  // -----------------------------------------------------------
  // Step 4 - Render (after onRender confirmation)
  // -----------------------------------------------------------
  function onRender() {
    if (!state._lastCalc || state._lastCalc.hasErrors) {
      showStatus('Cannot render — please fix errors above.', 'error');
      return;
    }
    if (!confirm('Render the proposal as a PDF? Your draft will be cleared after the PDF is downloaded.')) return;

    gotoStep(4);

    // Generate PDF
    setTimeout(async function () {
      try {
        var pdfResult = window.TrendzactProposalRender.render({
          draft: state.draft,
          calculation: state._lastCalc,
          catalog: state.catalog,
          partnerEmail: state.user ? state.user.email : ''
        });

        await clearDraftDoc();
        // Render success
        var body = document.getElementById('wiz-step-body');
        body.innerHTML = renderStep4Success(pdfResult);
        document.getElementById('wiz-stepper').innerHTML = renderStepper();
        document.getElementById('wiz-back').style.display = 'none';
        document.getElementById('wiz-restart').addEventListener('click', function () {
          state.draft = emptyDraft();
          state.draft.createdAt = new Date().toISOString();
          gotoStep(1);
        });
      } catch (e) {
        console.error('[Wizard] render failed', e);
        document.getElementById('wiz-step-body').innerHTML = renderStep4Failure(e);
      }
    }, 50);

    document.getElementById('wiz-step-body').innerHTML = renderStep4Loading();
  }

  function renderStep4Loading() {
    return '<div class="wiz-render-state">' +
             '<div class="wiz-spinner"></div>' +
             '<h2 class="wiz-h2">Generating proposal…</h2>' +
             '<p class="wiz-sub">Building PDF for ' + escapeHtml(state.draft.companyName) + '.</p>' +
           '</div>';
  }

  function renderStep4Success(pdfResult) {
    return '<div class="wiz-render-state wiz-render-success">' +
             '<div class="wiz-checkmark">✓</div>' +
             '<h2 class="wiz-h2">Proposal generated</h2>' +
             '<p class="wiz-sub">Proposal ID: <code>' + escapeHtml(pdfResult.proposalId) + '</code></p>' +
             '<p class="wiz-sub">PDF saved as <strong>' + escapeHtml(pdfResult.filename) + '</strong> to your Downloads folder.</p>' +
             '<div class="wiz-render-actions">' +
               '<button type="button" class="btn btn-primary" id="wiz-restart">Start a new proposal</button>' +
               '<a href="/" class="btn btn-ghost">Return to Home</a>' +
             '</div>' +
           '</div>';
  }

  function renderStep4Failure(err) {
    return '<div class="wiz-render-state wiz-render-error">' +
             '<h2 class="wiz-h2">Could not generate proposal</h2>' +
             '<p class="wiz-sub">' + escapeHtml(err.message || String(err)) + '</p>' +
             '<button type="button" class="btn btn-ghost" onclick="location.reload()">Reload</button>' +
           '</div>';
  }

  // -----------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------
  function showStatus(msg, kind) {
    var el = document.getElementById('wiz-status');
    if (!el) return;
    el.style.display = 'block';
    el.className = 'wiz-status wiz-status-' + (kind || 'info');
    el.textContent = msg;
    setTimeout(function () { el.style.display = 'none'; }, 6000);
  }

  function renderFatalError(msg) {
    var mount = document.getElementById('wizard-mount');
    if (!mount) return;
    mount.innerHTML = '<div class="wiz-error-box"><strong>Could not start Proposal Builder.</strong><p>' + escapeHtml(msg) + '</p></div>';
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function formatTimeAgo(iso) {
    try {
      var diff = Date.now() - new Date(iso).getTime();
      var mins = Math.round(diff / 60000);
      if (mins < 1) return 'just now';
      if (mins < 60) return mins + ' min ago';
      var hrs = Math.round(mins / 60);
      if (hrs < 24) return hrs + ' hr ago';
      var days = Math.round(hrs / 24);
      return days + ' day' + (days === 1 ? '' : 's') + ' ago';
    } catch (e) { return ''; }
  }

  // -----------------------------------------------------------
  window.TrendzactWizard = {
    init: init
  };
})();
