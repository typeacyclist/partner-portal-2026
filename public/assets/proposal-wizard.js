// Trendzact Partners — Proposal Wizard (v5-style, v7 catalog)
//
// Rebuilt against mockup v5 interaction model:
//   - 4 steps: Proposal Fields | Solution Selectors | Review & Calculate | Save & Submit
//   - Horizontal step chips, not numbered circles
//   - Collapsible sections (Required/Modules/Enhancements/One-Time) with count pills
//   - Modules rendered as accordions with inline features and nested option rows
//   - "None needed" acknowledgment checkboxes per optional section
//   - Field-level inline errors, section-level blockers
//   - Step 4 = Submit panel with proposal title, CC-to, UUID chip
//
// v7 changes:
//   - Module-count pricing (uniform MSRP base × moduleMultiplier × commitFactor)
//   - Commitment tiers (1yr/2yr/3yr) replace multi-year continuity
//   - Channel pricing: MSRP / Trendzact net / Distributor retains / Reseller retains
//   - Platform Options section removed (all omitted in v7)
//   - CORE SKU removed (absorbed into CARE)
//   - Subdomain selector added for channel discount lookup
//
// Reads the real v7 catalog from /catalog.json. Math is delegated to
// window.TrendzactMath.calculateProposal. PDF is delegated to
// window.TrendzactProposalRender.render.
//
// Persistence: Firestore autosave to users/{uid}/activeProposal/current
// Resume-or-fresh modal shows if a prior draft exists.

(function () {
  'use strict';

  // --------------------------------------------------------------
  // Constants
  // --------------------------------------------------------------
  var STEPS = [
    { id: 'fields',    num: '01', name: 'Proposal Fields' },
    { id: 'selectors', num: '02', name: 'Solution Selectors' },
    { id: 'review',    num: '03', name: 'Review & Calculate' },
    { id: 'submit',    num: '04', name: 'Save & Submit' }
  ];

  var REQUIRED_STEP1_FIELDS = [
    'prospectCompany', 'primaryContactName', 'primaryContactRole',
    'contactEmail', 'companySegment', 'expectedLicenseCount',
    'estDecisionDate', 'solutionChallenge'
  ];

  // Derive subdomain from current hostname (e.g. jlead.trendzact-partners-001.web.app → jlead).
  // Only returns a value if the candidate is a known key in catalog.subdomains —
  // so previews like www.* or staging.* fall through to the catalog's
  // defaultChannel (INDIRECT) instead of being silently treated as a partner.
  function detectSubdomain() {
    try {
      var host = window.location.hostname || '';
      var parts = host.split('.');
      if (parts.length <= 1) return '';
      var candidate = parts[0].toLowerCase();
      if (candidate === 'trendzact-partners-001' || candidate === 'localhost') return '';
      var subdomains = (state.catalog && state.catalog.subdomains) || {};
      return subdomains[candidate] ? candidate : '';
    } catch (e) { /* ignore */ }
    return '';
  }

  function currentYearMonth() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    return y + '-' + m;
  }

  // --------------------------------------------------------------
  // State
  // --------------------------------------------------------------
  function emptyDraft() {
    return {
      // Step 1 — Proposal Fields
      prospectCompany: '',
      primaryContactName: '',
      primaryContactRole: '',
      contactEmail: '',
      companySegment: '',
      expectedLicenseCount: '',
      estDecisionDate: currentYearMonth(),
      solutionChallenge: '',

      // Step 2 — Solution Selectors
      sectionOpen: { core: true, modules: true, enhancements: true, oneTime: true },
      sectionNone: { modules: false, enhancements: false, oneTime: false },
      moduleExpanded: [],        // array of module codes that are open
      selectedModules: [],       // module codes
      selectedModuleOptions: [], // enhancement codes (UVA-WEBCAM, PRIVSCR, etc.)
      selectedOneTime: [],       // one-time codes (including INIT-ONBRD which is required)

      // Step 4 — Submit fields
      proposalTitle: '',
      ccTo: '',

      // Meta
      fieldErrors: {},
      sectionErrors: {},
      createdAt: null,
      updatedAt: null
    };
  }

  var state = {
    catalog: null,
    user: null,
    db: null,
    draft: emptyDraft(),
    step: 0,
    saveTimer: null,
    isSaving: false,
    docRef: null,
    fsModule: null,
    initialized: false,
    submitResult: null   // { proposalId, filename } after successful render
  };

  // --------------------------------------------------------------
  // Init
  // --------------------------------------------------------------
  async function init() {
    if (state.initialized) return;
    state.initialized = true;

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
      state.db = window.TrendzactAuth && window.TrendzactAuth.db;
    } catch (e) {
      renderFatalError('Could not start the proposal builder: ' + e.message);
      return;
    }

    // Load Firestore module dynamically
    if (state.user && state.db) {
      try {
        var firestoreCdnUrl = 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
        state.fsModule = await import(firestoreCdnUrl);
        state.docRef = state.fsModule.doc(state.db, 'users', state.user.uid, 'activeProposal', 'current');
      } catch (e) {
        console.warn('[TP Wizard] Firestore module load failed; running without persistence', e);
      }
    }

    // Try to resume an existing draft
    var existingDraft = null;
    if (state.docRef) {
      try {
        var snap = await state.fsModule.getDoc(state.docRef);
        if (snap.exists()) existingDraft = snap.data();
      } catch (e) {
        console.warn('[TP Wizard] Could not load existing draft', e);
      }
    }

    // v6 drafts stored the prospect under `companyName`; v7 uses `prospectCompany`.
    // Treat either as evidence of a resumable draft.
    if (existingDraft && (existingDraft.prospectCompany || existingDraft.companyName)) {
      showResumeModal(existingDraft);
    } else {
      startFresh();
    }
  }

  // --------------------------------------------------------------
  // Resume-or-fresh modal
  // --------------------------------------------------------------
  function showResumeModal(existing) {
    var modal = document.createElement('div');
    modal.className = 'tp-modal-backdrop';
    var existingCompany = existing.prospectCompany || existing.companyName || '';
    modal.innerHTML =
        '<div class="tp-modal">' +
        '<h3>Continue where you left off?</h3>' +
        '<p>You have an in-progress proposal for <strong>' + esc(existingCompany) + '</strong>' +
        (existing.updatedAt ? ' (last saved ' + timeAgo(existing.updatedAt) + ')' : '') + '.</p>' +
        '<div class="tp-modal-actions">' +
        '<button type="button" data-act="fresh">Start fresh</button>' +
        '<button type="button" class="primary" data-act="resume">Continue</button>' +
        '</div>' +
        '</div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', function (e) {
      var t = e.target;
      if (t.dataset.act === 'resume') {
        var merged = emptyDraft();
        Object.keys(existing).forEach(function (k) {
          if (k in merged) {
            // For nested objects (sectionOpen, sectionNone), merge keys individually
            // so v7 keys survive even when resuming a v6 draft
            if ((k === 'sectionOpen' || k === 'sectionNone') && typeof existing[k] === 'object' && existing[k] !== null) {
              Object.keys(existing[k]).forEach(function (subKey) {
                merged[k][subKey] = existing[k][subKey];
              });
            } else {
              merged[k] = existing[k];
            }
          }
        });
        // Migrate v6 → v7: company-name field rename
        if (!merged.prospectCompany && existing.companyName) {
          merged.prospectCompany = existing.companyName;
        }
        // Migrate v6 → v7: if platform keys exist but enhancements don't, copy the state
        if (merged.sectionNone.platform !== undefined && merged.sectionNone.enhancements === undefined) {
          merged.sectionNone.enhancements = merged.sectionNone.platform;
        }
        if (merged.sectionOpen.platform !== undefined && merged.sectionOpen.enhancements === undefined) {
          merged.sectionOpen.enhancements = merged.sectionOpen.platform;
        }
        // v7 removed selectedPlatform — migrate any leftover selections
        if (existing.selectedPlatform && existing.selectedPlatform.length && !merged.selectedModuleOptions.length) {
          // Platform codes were a different concept; don't merge them into enhancements
        }
        state.draft = merged;
        modal.remove();
        renderShell();
        gotoStep(0);
      } else if (t.dataset.act === 'fresh') {
        modal.remove();
        if (!confirm('Start a new proposal? Your current draft will be cleared.')) {
          showResumeModal(existing);
          return;
        }
        clearDraftDoc();
        startFresh();
      }
    });
  }

  function startFresh() {
    state.draft = emptyDraft();
    state.draft.createdAt = new Date().toISOString();
    // INIT-ONBRD is always required/selected
    state.draft.selectedOneTime = ['INIT-ONBRD'];
    renderShell();
    gotoStep(0);
  }

  // --------------------------------------------------------------
  // Persistence
  // --------------------------------------------------------------
  function scheduleAutosave() {
    if (state.saveTimer) clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(persistDraft, 1500);
  }

  async function persistDraft() {
    state.draft.updatedAt = new Date().toISOString();
    if (!state.draft.createdAt) state.draft.createdAt = state.draft.updatedAt;

    updateSaveIndicator('saving');
    if (!state.docRef) {
      updateSaveIndicator('saved');
      return;
    }
    state.isSaving = true;
    try {
      // Strip transient fields before save
      var savable = Object.assign({}, state.draft);
      delete savable.fieldErrors;
      delete savable.sectionErrors;
      await state.fsModule.setDoc(state.docRef, savable, { merge: true });
      updateSaveIndicator('saved');
    } catch (e) {
      console.error('[TP Wizard] autosave failed', e);
      updateSaveIndicator('error');
    } finally {
      state.isSaving = false;
    }
  }

  async function clearDraftDoc() {
    if (!state.docRef) return;
    try { await state.fsModule.deleteDoc(state.docRef); }
    catch (e) { console.warn('[TP Wizard] clearing draft failed', e); }
  }

  function updateSaveIndicator(which) {
    var el = document.getElementById('tp-save-indicator');
    if (!el) return;
    var labels = {
      saving: '<span class="tp-dot tp-dot-amber"></span> Saving…',
      saved:  '<span class="tp-dot tp-dot-green"></span> Saved',
      error:  '<span class="tp-dot tp-dot-red"></span> Save failed'
    };
    el.innerHTML = labels[which] || '';
  }

  // --------------------------------------------------------------
  // Shell
  // --------------------------------------------------------------
  function renderShell() {
    var mount = document.getElementById('wizard-mount');
    if (!mount) return;
    mount.innerHTML =
        '<div class="tp-wizard">' +
        '<div class="tp-stepbar" id="tp-stepbar"></div>' +
        '<div class="tp-panel" id="tp-panel"></div>' +
        '<div class="tp-nav">' +
        '<button type="button" id="tp-back">← Back</button>' +
        '<div class="tp-nav-meta">' +
        '<span class="tp-save-indicator" id="tp-save-indicator"></span>' +
        '</div>' +
        '<button type="button" id="tp-next" class="primary">Next →</button>' +
        '</div>' +
        '</div>';

    document.getElementById('tp-back').addEventListener('click', function () {
      if (state.step > 0) gotoStep(state.step - 1);
    });
    document.getElementById('tp-next').addEventListener('click', onNext);
  }

  function renderStepbar() {
    var sb = document.getElementById('tp-stepbar');
    if (!sb) return;
    sb.innerHTML = STEPS.map(function (s, i) {
      var cls = i === state.step ? 'active' : (i < state.step ? 'done' : '');
      return '<div class="tp-step-chip ' + cls + '" data-idx="' + i + '">' +
          '<span class="tp-step-num">STEP ' + s.num + '</span>' +
          '<span class="tp-step-name">' + s.name + '</span>' +
          '</div>';
    }).join('');
    sb.querySelectorAll('.tp-step-chip').forEach(function (el) {
      el.addEventListener('click', function () {
        var idx = parseInt(el.dataset.idx, 10);
        // Allow jumping back to any earlier step. Forward only through Next button.
        if (idx <= state.step) { gotoStep(idx); }
      });
    });
  }

  function gotoStep(n) {
    if (n < 0 || n >= STEPS.length) return;
    state.step = n;
    var panel = document.getElementById('tp-panel');
    renderStepbar();
    var stepId = STEPS[state.step].id;
    if (stepId === 'fields')    panel.innerHTML = renderFields();
    else if (stepId === 'selectors') panel.innerHTML = renderSelectors();
    else if (stepId === 'review')    panel.innerHTML = renderReview();
    else if (stepId === 'submit')    panel.innerHTML = renderSubmit();
    bindStepHandlers();
    updateNavButtons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateNavButtons() {
    var back = document.getElementById('tp-back');
    var next = document.getElementById('tp-next');
    back.disabled = state.step === 0;
    if (state.step === STEPS.length - 1) {
      next.style.display = 'none';
    } else {
      next.style.display = '';
      if (state.step === STEPS.length - 2) {
        next.textContent = 'Save & Submit →';
      } else if (state.step === 1) {
        next.textContent = 'Review →';
      } else {
        next.textContent = 'Next →';
      }
    }
  }

  function onNext() {
    var stepId = STEPS[state.step].id;
    if (stepId === 'fields') {
      if (!validateStep1()) { gotoStep(state.step); return; }
    } else if (stepId === 'selectors') {
      if (!validateStep2()) { gotoStep(state.step); return; }
    }
    if (state.step < STEPS.length - 1) gotoStep(state.step + 1);
  }

  // ==============================================================
  // STEP 1 — Proposal Fields
  // ==============================================================
  function renderFields() {
    var d = state.draft;
    var segOptions = state.catalog.companySizeSegments.map(function (s) {
      var sel = d.companySegment === s.key ? 'selected' : '';
      return '<option value="' + esc(s.key) + '" ' + sel + '>' + esc(s.label) + ' (' + esc(s.headcountRange) + ')</option>';
    }).join('');

    return (
        '<h3>Step 1 — Proposal Fields</h3>' +
        '<p class="tp-lede">Capture the prospect and company size. All fields are required.</p>' +
        '<div class="tp-grid-2">' +
        fieldHtml('Prospect Company', 'f-company', 'text', d.prospectCompany,
            'Acme Manufacturing', 'Legal or doing-business-as name as it will appear on the proposal PDF.', 'prospectCompany') +
        fieldHtml('Primary Contact Name', 'f-contact', 'text', d.primaryContactName,
            'Jane Doe', 'Whoever receives the emailed proposal.', 'primaryContactName') +
        fieldHtml('Primary Contact Role', 'f-role', 'text', d.primaryContactRole,
            'CIO / VP Security / Head of HR Ops', 'Free text. Helps position the pitch on the cover page.', 'primaryContactRole') +
        fieldHtml('Contact Email', 'f-email', 'email', d.contactEmail,
            'jane@acme.com', 'Used when you submit — this is where the PDF gets emailed.', 'contactEmail') +
        selectHtml('Company Size Segment', 'f-seg',
            '<option value="">— Select a segment —</option>' + segOptions,
            'Drives CARE tier, onboarding tier, and SLA alignment.', 'companySegment') +
        fieldHtml('Monitored Users (annual named user)', 'f-licenses', 'number', d.expectedLicenseCount,
            '500', 'Per-named-user annual licensing.', 'expectedLicenseCount', 'min="1"') +
        fieldHtml('Est. Decision Date', 'f-decision', 'month', d.estDecisionDate,
            '', 'Month-level precision is fine for pipeline.', 'estDecisionDate') +
        '<div class="tp-field" style="grid-column:1/-1;">' +
        '<label>Explain Prospective Client Challenge / Pain Points<span class="req">*</span></label>' +
        '<textarea id="f-challenge" rows="3" class="' + fieldCls('solutionChallenge') + '" ' +
        'placeholder="e.g., BPO client under audit pressure for clear-desk compliance across 800 remote agents...">' +
        esc(d.solutionChallenge) + '</textarea>' +
        '<p class="tp-hint">Appears on the proposal cover page. 2–4 sentences works best.</p>' +
        fieldErrHtml('solutionChallenge') +
        '</div>' +
        '</div>'
    );
  }

  function fieldHtml(label, id, type, val, ph, hint, key, extra) {
    extra = extra || '';
    // noinspection HtmlWrongAttributeValue
    return '<div class="tp-field">' +
        '<label>' + label + '<span class="req">*</span></label>' +
        '<input type="' + type + '" id="' + id + '" value="' + esc(val) + '" placeholder="' + esc(ph) + '" class="' + fieldCls(key) + '" ' + extra + '/>' +
        '<p class="tp-hint">' + esc(hint) + '</p>' +
        fieldErrHtml(key) +
        '</div>';
  }

  function selectHtml(label, id, optionsHtml, hint, key) {
    return '<div class="tp-field">' +
        '<label>' + label + '<span class="req">*</span></label>' +
        '<select id="' + id + '" class="' + fieldCls(key) + '">' + optionsHtml + '</select>' +
        '<p class="tp-hint">' + esc(hint) + '</p>' +
        fieldErrHtml(key) +
        '</div>';
  }

  function fieldCls(key) {
    return state.draft.fieldErrors && state.draft.fieldErrors[key] ? 'invalid' : '';
  }
  function fieldErrHtml(key) {
    if (state.draft.fieldErrors && state.draft.fieldErrors[key]) {
      return '<div class="tp-field-error show">' + esc(state.draft.fieldErrors[key]) + '</div>';
    }
    return '';
  }

  function bindStep1() {
    function g(id) { return document.getElementById(id); }
    var map = {
      'f-company': 'prospectCompany', 'f-contact': 'primaryContactName',
      'f-role': 'primaryContactRole', 'f-email': 'contactEmail',
      'f-seg': 'companySegment',
      'f-licenses': 'expectedLicenseCount', 'f-decision': 'estDecisionDate',
      'f-challenge': 'solutionChallenge'
    };
    Object.keys(map).forEach(function (id) {
      var el = g(id);
      if (!el) return;
      var key = map[id];
      var handler = function () {
        var v = el.value;
        if (key === 'expectedLicenseCount') v = parseInt(v, 10) || '';
        state.draft[key] = v;
        if (state.draft.fieldErrors && state.draft.fieldErrors[key]) {
          delete state.draft.fieldErrors[key];
          el.classList.remove('invalid');
          var errEl = el.parentElement.querySelector('.tp-field-error');
          if (errEl) errEl.classList.remove('show');
        }
        scheduleAutosave();
      };
      el.addEventListener('input', handler);
      el.addEventListener('change', handler);
    });
  }

  function validateStep1() {
    var errs = {};
    REQUIRED_STEP1_FIELDS.forEach(function (k) {
      var v = state.draft[k];
      if (v === '' || v === null || v === undefined) errs[k] = 'Required';
    });
    // Extra: email format
    if (!errs.contactEmail && state.draft.contactEmail) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.draft.contactEmail)) {
        errs.contactEmail = 'Invalid email address';
      }
    }
    // Extra: positive license count
    if (!errs.expectedLicenseCount) {
      var lc = parseInt(state.draft.expectedLicenseCount, 10);
      if (!lc || lc < 1) errs.expectedLicenseCount = 'Must be at least 1';
    }
    state.draft.fieldErrors = errs;
    return Object.keys(errs).length === 0;
  }

  // ==============================================================
  // STEP 2 — Solution Selectors
  // ==============================================================
  function catalogByCategory() {
    // Returns grouped SKU arrays for Step 2 rendering.
    var cat = state.catalog.skus.filter(function (s) { return s.isActive !== false; });
    return {
      required: cat.filter(function (s) {
        var b = (s.selection && s.selection.displayBadges) || [];
        return b.indexOf('REQUIRED') !== -1 && s.category !== '30-Setup/Integration Option';
      }).sort(byDisplayOrder),
      modules: cat.filter(function (s) {
        return s.category === '10-Data Exposure Coverage';
      }).sort(byDisplayOrder),
      enhancements: cat.filter(function (s) {
        return s.category === '20-Extended Coverage Option';
      }).sort(byDisplayOrder),
      oneTime: cat.filter(function (s) {
        return s.category === '30-Setup/Integration Option';
      }).sort(byDisplayOrder)
    };
  }

  function byDisplayOrder(a, b) {
    return (a.displayOrder || 999) - (b.displayOrder || 999);
  }

  // Return options whose parentCodes includes given module code
  function childOptionsFor(moduleCode) {
    return state.catalog.skus.filter(function (s) {
      var sel = s.selection || {};
      if (sel.mode !== 'conditional') return false;
      if (!Array.isArray(sel.parentCodes)) return false;
      return sel.parentCodes.indexOf(moduleCode) !== -1 && s.isActive !== false;
    }).sort(byDisplayOrder);
  }

  function isBeta(sku) {
    var b = (sku.selection && sku.selection.displayBadges) || [];
    return b.indexOf('BETA') !== -1;
  }

  function isNewGa(sku) {
    var b = (sku.selection && sku.selection.displayBadges) || [];
    return b.indexOf('NEW GA') !== -1;
  }

  // v7: No inline price labels in Step 2 selection UI — pricing shown only in Step 3 Review

  function sectionStatus(id) {
    var d = state.draft;
    var groups = catalogByCategory();
    if (id === 'core') {
      var ct = groups.required.length;
      return { label: ct + ' included', klass: 'ok' };
    }

    // Check if the section has any selectable items
    var hasItems = true;
    if (id === 'modules') hasItems = groups.modules.length > 0;
    else if (id === 'enhancements') hasItems = groups.enhancements.length > 0;
    else if (id === 'oneTime') {
      hasItems = (groups.oneTime || []).some(function (s) {
        var badges = (s.selection && s.selection.displayBadges) || [];
        return badges.indexOf('REQUIRED') === -1;
      });
    }
    if (!hasItems) return { label: 'No items available', klass: 'ok' };

    var count = 0;
    if (id === 'modules') count = d.selectedModules.length;
    else if (id === 'enhancements') count = d.selectedModuleOptions.length;
    else if (id === 'oneTime') {
      count = d.selectedOneTime.filter(function (c) { return c !== 'INIT-ONBRD'; }).length;
    }
    var noneAck = d.sectionNone[id];
    if (count > 0) return { label: count + ' selected', klass: 'ok' };
    if (noneAck) return { label: 'None needed (acknowledged)', klass: 'ok' };
    return { label: 'Needs selection or None', klass: 'warn' };
  }

  function renderSelectors() {
    var groups = catalogByCategory();
    var d = state.draft;

    // Required core services
    var coreHtml = groups.required.map(function (s) {
      return '<div class="tp-required-card">' +
          '<span class="tp-required-badge">REQUIRED</span>' +
          '<div>' +
          '<p class="tp-required-title"><span class="tp-sku-code">' + esc(s.code) + '</span> ' + esc(s.name) + '</p>' +
          '<p class="tp-required-desc">' + esc(s.description || '') + '</p>' +
          '</div>' +
          '</div>';
    }).join('');

    // Modules section
    var modCount = d.selectedModules.length;
    var modulesNone =
        '<div class="tp-none-row">' +
        '<input type="checkbox" id="none-modules" ' +
        (d.sectionNone.modules ? 'checked' : '') +
        (modCount > 0 ? ' disabled' : '') + '/>' +
        '<label for="none-modules">None needed for this opportunity (acknowledge to proceed)</label>' +
        '</div>';

    var modulesHtml = groups.modules.map(function (m) {
      var selected = d.selectedModules.indexOf(m.code) !== -1;
      var open = d.moduleExpanded.indexOf(m.code) !== -1;
      var beta = isBeta(m);
      var newga = isNewGa(m);
      var disabled = d.sectionNone.modules && !selected;

      var badgeHtml = '';
      if (beta) badgeHtml = '<span class="tp-badge tp-badge-beta">BETA</span>';
      else if (newga) badgeHtml = '<span class="tp-badge tp-badge-newga">NEW GA</span>';

      var children = childOptionsFor(m.code);
      var childSelectedCount = children.filter(function (c) {
        return d.selectedModuleOptions.indexOf(c.code) !== -1;
      }).length;

      var rightSide = '';
      if (!beta && childSelectedCount > 0) {
        rightSide = '<span class="tp-sku-opt-count">+' + childSelectedCount + ' enhancement' + (childSelectedCount > 1 ? 's' : '') + '</span>';
      }

      var accordionBody = '';
      if (open) {
        var incl = (m.features && m.features.included) || [];
        var featsHtml = '';
        if (incl.length) {
          featsHtml =
              '<div class="tp-feature-head">Included Detections</div>' +
              '<div class="tp-feature-list">' +
              incl.map(function (f) { return '<span class="inc">' + esc(f) + '</span>'; }).join('') +
              '</div>';
        }

        var optsHtml = '';
        // Only render children if parent is GA (not BETA) per schema rule C2.
        if (!beta) {
          var visibleChildren = children.filter(function (c) { return !isBeta(c); });
          if (visibleChildren.length) {
            optsHtml =
                '<div class="tp-feature-head">Enhancements</div>' +
                visibleChildren.map(function (o) {
                  var oSel = d.selectedModuleOptions.indexOf(o.code) !== -1;
                  var oDisabled = !selected;
                  return '<div class="tp-opt-row">' +
                      '<input type="checkbox" data-mopt="' + esc(o.code) + '" ' +
                      (oSel ? 'checked' : '') + (oDisabled ? ' disabled' : '') + '/>' +
                      '<label>' +
                      '<span class="tp-sku-code">' + esc(o.code) + '</span> ' + esc(o.name) +
                      '</label>' +
                      '</div>';
                }).join('');
            if (!selected) {
              optsHtml += '<p class="tp-hint" style="margin-top:6px;">Select the parent coverage to enable these enhancements.</p>';
            }
          }
        }

        accordionBody = '<div class="tp-accordion-body">' + featsHtml + optsHtml + '</div>';
      }

      var classes = 'tp-accordion-item';
      if (selected && !beta) classes += ' selected';
      if (open) classes += ' open';
      if (beta) classes += ' beta';

      var headStyle = disabled ? 'opacity:0.5;' : '';

      return '<div class="' + classes + '" data-module="' + esc(m.code) + '">' +
          '<div class="tp-accordion-head" style="' + headStyle + '" data-accordion-head="' + esc(m.code) + '">' +
          '<span class="tp-caret">▶</span>' +
          '<input type="checkbox" data-module-check="' + esc(m.code) + '" ' +
          (selected && !beta ? 'checked' : '') +
          (beta || disabled ? ' disabled' : '') + '/>' +
          '<div class="tp-sku-body">' +
          '<div class="tp-sku-line">' +
          '<span class="tp-sku-code">' + esc(m.code) + '</span>' +
          '<span class="tp-sku-name">' + esc(m.name) + '</span>' +
          badgeHtml +
          rightSide +
          '</div>' +
          '<p class="tp-sku-desc">' + esc(m.description || '') + '</p>' +
          '</div>' +
          '</div>' +
          accordionBody +
          '</div>';
    }).join('');

    // Enhancements section (standalone — not nested under modules)
    var enhCount = d.selectedModuleOptions.length;
    var enhNone =
        '<div class="tp-none-row">' +
        '<input type="checkbox" id="none-enhancements" ' +
        (d.sectionNone.enhancements ? 'checked' : '') +
        (enhCount > 0 ? ' disabled' : '') + '/>' +
        '<label for="none-enhancements">None needed for this opportunity (acknowledge to proceed)</label>' +
        '</div>';

    var enhHtml = groups.enhancements.map(function (e) {
      var sel = d.selectedModuleOptions.indexOf(e.code) !== -1;
      var disabled = d.sectionNone.enhancements && !sel;
      // Check if parent is selected (conditional enhancement)
      var parentCheck = e.selection && e.selection.mode === 'conditional' && Array.isArray(e.selection.parentCodes);
      var parentMissing = parentCheck && !e.selection.parentCodes.some(function (p) { return d.selectedModules.indexOf(p) !== -1; });
      if (parentMissing) disabled = true;
      var parentNote = parentMissing && parentCheck
          ? '<p class="tp-hint" style="margin-top:4px;">Requires parent module: ' + esc(e.selection.parentCodes.join(' or ')) + '</p>'
          : '';
      return '<div class="tp-sku-row' + (sel ? ' selected' : '') + (disabled ? ' disabled' : '') + '" data-enhancement="' + esc(e.code) + '">' +
          '<input type="checkbox" ' + (sel ? 'checked' : '') + (disabled ? ' disabled' : '') + '/>' +
          '<div class="tp-sku-body">' +
          '<div class="tp-sku-line">' +
          '<span class="tp-sku-code">' + esc(e.code) + '</span>' +
          '<span class="tp-sku-name">' + esc(e.name) + '</span>' +
          '</div>' +
          '<p class="tp-sku-desc">' + esc(e.description || '') + '</p>' +
          parentNote +
          '</div>' +
          '</div>';
    }).join('');

    // One-Time section — INIT-ONBRD is required/always selected
    var optionalOneTimeCount = d.selectedOneTime.filter(function (c) { return c !== 'INIT-ONBRD'; }).length;
    var oneTimeNone =
        '<div class="tp-none-row">' +
        '<input type="checkbox" id="none-onetime" ' +
        (d.sectionNone.oneTime ? 'checked' : '') +
        (optionalOneTimeCount > 0 ? ' disabled' : '') + '/>' +
        '<label for="none-onetime">No additional integrations or assessments needed (acknowledge to proceed)</label>' +
        '</div>';

    var oneTimeHtml = groups.oneTime.map(function (o) {
      var sel = d.selectedOneTime.indexOf(o.code) !== -1;
      var req = (o.selection && o.selection.displayBadges || []).indexOf('REQUIRED') !== -1;
      var disabled = !req && d.sectionNone.oneTime && !sel;
      var requiredBadge = req ? '<span class="tp-badge tp-badge-required" style="margin-left:auto;">REQUIRED</span>' : '';
      return '<div class="tp-sku-row' + (sel ? ' selected' : '') + (disabled ? ' disabled' : '') + '" data-onetime="' + esc(o.code) + '">' +
          '<input type="checkbox" ' + (sel ? 'checked' : '') + (req || disabled ? ' disabled' : '') + '/>' +
          '<div class="tp-sku-body">' +
          '<div class="tp-sku-line">' +
          '<span class="tp-sku-code">' + esc(o.code) + '</span>' +
          '<span class="tp-sku-name">' + esc(o.name) + '</span>' +
          requiredBadge +
          '</div>' +
          '<p class="tp-sku-desc">' + esc(o.description || '') + '</p>' +
          '</div>' +
          '</div>';
    }).join('');

    // Helper to render a section
    function sectionHtml(id, title, bodyInnerHtml, subtext) {
      var st = sectionStatus(id);
      var invalid = state.draft.sectionErrors && state.draft.sectionErrors[id];
      var classes = 'tp-section';
      if (d.sectionOpen[id]) classes += ' open';
      if (invalid) classes += ' invalid';
      var subtextHtml = subtext
          ? '<span class="tp-section-subtext">' + esc(subtext) + '</span>'
          : '';
      return '<div class="' + classes + '" data-section="' + id + '">' +
          '<div class="tp-section-toggle" data-section-toggle="' + id + '">' +
          '<span class="tp-section-caret">▶</span>' +
          '<span class="tp-section-title">' + esc(title) + '</span>' +
          subtextHtml +
          '<span class="tp-section-count ' + (st.klass || '') + '">' + esc(st.label) + '</span>' +
          '</div>' +
          (d.sectionOpen[id] ? '<div class="tp-section-body">' + bodyInnerHtml + '</div>' : '') +
          '</div>';
    }

    var blocker = '';
    if (state.draft.sectionErrors && Object.keys(state.draft.sectionErrors).length) {
      blocker = '<div class="tp-section-blocker">Every optional section needs at least one selection or a "None needed" acknowledgment before continuing.</div>';
    }

    return (
        '<h3>Step 2 — Solution Selectors</h3>' +
        '<p class="tp-lede">Pick what the prospect needs in each section. If a section doesn\'t apply, check "None needed" to acknowledge.</p>' +

        sectionHtml('core', 'Core Services', coreHtml) +
        sectionHtml(
            'modules',
            'Select Your Data Exposure Coverage',
            modulesNone + modulesHtml,
            'Define where sensitive data is exposed — and apply real-time protection'
        ) +
        sectionHtml('enhancements', 'Enhancements', enhNone + enhHtml,
            'Per-user and connector enhancements for selected modules') +
        sectionHtml('oneTime', 'One-Time Setup & Integrations', oneTimeNone + oneTimeHtml) +
        blocker
    );
  }

  function bindStep2() {
    var d = state.draft;

    // Section toggles
    document.querySelectorAll('[data-section-toggle]').forEach(function (el) {
      el.addEventListener('click', function () {
        var id = el.dataset.sectionToggle;
        d.sectionOpen[id] = !d.sectionOpen[id];
        scheduleAutosave();
        reRenderStep2();
      });
    });

    // Accordion toggles (click on head, but not on the checkbox itself)
    document.querySelectorAll('[data-accordion-head]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        // Don't toggle if clicking the checkbox
        if (e.target.tagName === 'INPUT') return;
        var code = el.dataset.accordionHead;
        var i = d.moduleExpanded.indexOf(code);
        if (i === -1) d.moduleExpanded.push(code);
        else d.moduleExpanded.splice(i, 1);
        reRenderStep2();
      });
    });

    // Module checkboxes
    document.querySelectorAll('[data-module-check]').forEach(function (el) {
      el.addEventListener('click', function (e) { e.stopPropagation(); });
      el.addEventListener('change', function () {
        var code = el.dataset.moduleCheck;
        var i = d.selectedModules.indexOf(code);
        if (el.checked && i === -1) {
          d.selectedModules.push(code);
          // If 'None needed' was checked, uncheck it
          d.sectionNone.modules = false;
        } else if (!el.checked && i !== -1) {
          d.selectedModules.splice(i, 1);
          // Cascade: remove any child options that no longer have a parent
          var children = childOptionsFor(code);
          children.forEach(function (c) {
            // Check if this child has any other selected parent
            var otherParents = (c.selection.parentCodes || []).filter(function (p) { return p !== code && d.selectedModules.indexOf(p) !== -1; });
            if (otherParents.length === 0) {
              var ci = d.selectedModuleOptions.indexOf(c.code);
              if (ci !== -1) d.selectedModuleOptions.splice(ci, 1);
            }
          });
        }
        // Clear any section error
        if (d.sectionErrors && d.sectionErrors.modules) delete d.sectionErrors.modules;
        scheduleAutosave();
        reRenderStep2();
      });
    });

    // Module option checkboxes
    document.querySelectorAll('[data-mopt]').forEach(function (el) {
      el.addEventListener('change', function () {
        var code = el.dataset.mopt;
        var i = d.selectedModuleOptions.indexOf(code);
        if (el.checked && i === -1) d.selectedModuleOptions.push(code);
        else if (!el.checked && i !== -1) d.selectedModuleOptions.splice(i, 1);
        scheduleAutosave();
        reRenderStep2();
      });
    });

    // Enhancement rows — standalone section
    document.querySelectorAll('[data-enhancement]').forEach(function (el) {
      el.addEventListener('click', function () {
        if (el.classList.contains('disabled')) return;
        var code = el.dataset.enhancement;
        var i = d.selectedModuleOptions.indexOf(code);
        if (i === -1) {
          d.selectedModuleOptions.push(code);
          d.sectionNone.enhancements = false;
        } else {
          d.selectedModuleOptions.splice(i, 1);
        }
        if (d.sectionErrors && d.sectionErrors.enhancements) delete d.sectionErrors.enhancements;
        scheduleAutosave();
        reRenderStep2();
      });
    });

    // One-Time rows
    document.querySelectorAll('[data-onetime]').forEach(function (el) {
      el.addEventListener('click', function () {
        if (el.classList.contains('disabled')) return;
        var code = el.dataset.onetime;
        // Find the SKU to check if it's required
        var sku = state.catalog.skus.find(function (s) { return s.code === code; });
        if (!sku) return;
        var reqBadge = (sku.selection && sku.selection.displayBadges || []).indexOf('REQUIRED') !== -1;
        if (reqBadge) return;  // Cannot toggle required ones
        var i = d.selectedOneTime.indexOf(code);
        if (i === -1) {
          d.selectedOneTime.push(code);
          d.sectionNone.oneTime = false;
        } else {
          d.selectedOneTime.splice(i, 1);
        }
        if (d.sectionErrors && d.sectionErrors.oneTime) delete d.sectionErrors.oneTime;
        scheduleAutosave();
        reRenderStep2();
      });
    });

    // None-needed checkboxes
    var noneModules = document.getElementById('none-modules');
    if (noneModules) noneModules.addEventListener('change', function () {
      d.sectionNone.modules = noneModules.checked;
      if (d.sectionErrors && d.sectionErrors.modules) delete d.sectionErrors.modules;
      scheduleAutosave();
      reRenderStep2();
    });

    var noneEnh = document.getElementById('none-enhancements');
    if (noneEnh) noneEnh.addEventListener('change', function () {
      d.sectionNone.enhancements = noneEnh.checked;
      if (d.sectionErrors && d.sectionErrors.enhancements) delete d.sectionErrors.enhancements;
      scheduleAutosave();
      reRenderStep2();
    });

    var noneOne = document.getElementById('none-onetime');
    if (noneOne) noneOne.addEventListener('change', function () {
      d.sectionNone.oneTime = noneOne.checked;
      if (d.sectionErrors && d.sectionErrors.oneTime) delete d.sectionErrors.oneTime;
      scheduleAutosave();
      reRenderStep2();
    });
  }

  function reRenderStep2() {
    var panel = document.getElementById('tp-panel');
    panel.innerHTML = renderSelectors();
    bindStep2();
  }

  function validateStep2() {
    var errs = {};
    var d = state.draft;
    var groups = catalogByCategory();

    // Only require action if the section has items to choose from
    if (groups.modules.length > 0) {
      if (d.selectedModules.length === 0 && !d.sectionNone.modules) errs.modules = true;
    }
    if (groups.enhancements.length > 0) {
      if (d.selectedModuleOptions.length === 0 && !d.sectionNone.enhancements) errs.enhancements = true;
    }
    var optOneTime = (groups.oneTime || []).filter(function (s) {
      var badges = (s.selection && s.selection.displayBadges) || [];
      return badges.indexOf('REQUIRED') === -1;
    });
    if (optOneTime.length > 0) {
      var selectedOptional = d.selectedOneTime.filter(function (c) { return c !== 'INIT-ONBRD'; });
      if (selectedOptional.length === 0 && !d.sectionNone.oneTime) errs.oneTime = true;
    }

    d.sectionErrors = errs;
    return Object.keys(errs).length === 0;
  }

  // ==============================================================
  // STEP 3 — Review & Calculate
  // ==============================================================
  function buildDraftForMathEngine(overrideYears) {
    var d = state.draft;
    // Aggregate all selections into the draft format the math engine expects
    var selected = []
        .concat(d.selectedModules)
        .concat(d.selectedModuleOptions)
        .concat(d.selectedOneTime);
    return {
      companyName: d.prospectCompany,
      contactName: d.primaryContactName,
      contactEmail: d.contactEmail,
      proposalTitle: d.proposalTitle,
      primaryUseCase: d.solutionChallenge,
      dealStage: 'Proposal',
      estimatedCloseDate: d.estDecisionDate,
      sector: 'commercial',
      companySegment: d.companySegment,
      userCount: parseInt(d.expectedLicenseCount, 10) || 0,
      contractYears: overrideYears || 1,
      subdomain: detectSubdomain(),
      selectedSkuCodes: selected,
      notes: ''
    };
  }

  function renderReview() {
    var d = state.draft;
    // Calculate all 3 commitment tiers
    var allTiers = TrendzactMath.calculateAllTiers(buildDraftForMathEngine(1), state.catalog);
    var calc1 = allTiers[0]; // 1yr reference
    state._lastCalc = calc1;
    state._allTiers = allTiers;
    var fmt = TrendzactMath.formatMoney;

    var seg = state.catalog.companySizeSegments.find(function (s) { return s.key === d.companySegment; });
    var segLabel = seg ? seg.label : '—';
    var licenseCount = parseInt(d.expectedLicenseCount, 10) || 0;

    var mods = d.selectedModules;
    var modOpts = d.selectedModuleOptions;
    var oneOptional = d.selectedOneTime.filter(function (c) { return c !== 'INIT-ONBRD'; });

    var skuName = function (code) {
      var s = state.catalog.skus.find(function (x) { return x.code === code; });
      return s ? s.name : code;
    };

    var errorsHtml = '';
    if (calc1.errors && calc1.errors.length) {
      errorsHtml = '<div class="tp-section-blocker">Cannot calculate: ' + calc1.errors.map(esc).join('; ') + '</div>';
    }

    var itemList = function (codes, emptyText) {
      if (!codes.length) return '<li style="color:var(--med-gray);">' + esc(emptyText) + '</li>';
      return codes.map(function (c) {
        return '<li><code>' + esc(c) + '</code> — ' + esc(skuName(c)) + '</li>';
      }).join('');
    };

    // --- Included SKU sections ---
    var groups = catalogByCategory();

    // Find line prices from 1yr calc
    var findLine = function (code) {
      return (calc1.lines || []).find(function (l) { return l.code === code; });
    };

    // CARE line
    var careLine = findLine('CARE');
    var carePrice = careLine ? careLine.msrpLine : 0;

    // Categorize priced lines using the same predicates as the PDF renderer
    // so the two surfaces never disagree about which row money lands in.
    // - Modules → Named User License (per-user)
    // - Per-user enhancements (discountGroup='enhancement') → Named User License
    // - Flat connectors (recurring, regular discount group, not CARE) → separate Connectors row
    var moduleTotalAnnual = 0;
    var perUserEnhTotal = 0;
    var connectorTotal = 0;
    var moduleNames = [];
    var perUserEnhNames = [];
    var connectorNames = [];
    (calc1.lines || []).forEach(function (l) {
      if (l.isModule) { moduleTotalAnnual += l.msrpLine; moduleNames.push(l.code); }
      else if (l.discountGroup === 'enhancement') { perUserEnhTotal += l.msrpLine; perUserEnhNames.push(l.code); }
      else if (l.timing === 'recurring' && l.code !== 'CARE') { connectorTotal += l.msrpLine; connectorNames.push(l.code); }
    });
    var namedUserTotal = moduleTotalAnnual + perUserEnhTotal;
    var namedUserPerUser = licenseCount > 0 ? namedUserTotal / licenseCount : 0;

    // INIT-ONBRD line
    var onbrdLine = findLine('INIT-ONBRD');
    var onbrdPrice = onbrdLine ? onbrdLine.msrpLine : 0;
    // Other one-time lines
    var otherOneTimeTotal = 0;
    oneOptional.forEach(function (code) {
      var line = findLine(code);
      if (line) otherOneTimeTotal += line.msrpLine;
    });

    // --- Annual commitment tiers ---
    // Annual total = CARE + named-user-total (modules+enh) + other-one-time-recurring
    // Commitment factor only applies to per-user items
    // We use the allTiers calc which already has the commitment baked in

    // --- Prospect Summary (mirrors PDF page 1's PREPARED FOR / PROPOSAL DETAILS) ---
    var inp = calc1.input || {};
    var prospectRows = [
      ['Company', d.prospectCompany || '—'],
      ['Contact', d.primaryContactName || '—'],
      ['Email', d.contactEmail || '—'],
      ['Use Case', d.solutionChallenge ? (d.solutionChallenge.length > 80 ? d.solutionChallenge.slice(0, 79) + '…' : d.solutionChallenge) : '—'],
      ['Est. Decision', d.estDecisionDate || '—'],
      ['Proposal Title', d.proposalTitle || '— (set in Step 4)']
    ];
    var prospectHtml = prospectRows.map(function (r) {
      return '<div class="tp-summary-row"><span class="tp-pricing-label">' + esc(r[0]) + '</span><span>' + esc(r[1]) + '</span></div>';
    }).join('');

    return (
        '<h3>Step 3 — Review &amp; Calculate</h3>' +
        '<p class="tp-lede">MSRP pricing summary for prospect review. Click "Edit →" to adjust selections.</p>' +

        errorsHtml +

        // --- Prospect Summary ---
        '<div class="tp-review-section">' +
        '<div class="tp-review-head">' +
        '<span class="tp-review-title">Prospect</span>' +
        '<button class="tp-review-edit" data-goto="0">Edit →</button>' +
        '</div>' +
        '<div style="margin-top:8px; font-size:13px;">' + prospectHtml + '</div>' +
        '</div>' +

        // --- Pricing Inputs ---
        '<div class="tp-review-section">' +
        '<div class="tp-review-head">' +
        '<span class="tp-review-title">Pricing Inputs</span>' +
        '<button class="tp-review-edit" data-goto="0">Edit →</button>' +
        '</div>' +
        '<div style="margin-top:8px; font-size:13px;">' +
        '<div class="tp-summary-row"><span class="tp-pricing-label">Company size</span><span>' + esc(segLabel) + '</span></div>' +
        '<div class="tp-summary-row"><span class="tp-pricing-label">Volume bracket</span><span>' + esc(inp.bracket || '—') + '</span></div>' +
        '<div class="tp-summary-row"><span class="tp-pricing-label">Licenses</span><span>' + licenseCount.toLocaleString('en-US') + '</span></div>' +
        '<div class="tp-summary-row"><span class="tp-pricing-label">Module count</span><span>' + (inp.moduleCount || 0) + ' modules × ' + (inp.moduleMultiplier || 0).toFixed(2) + ' multiplier</span></div>' +
        '</div>' +
        '</div>' +

        // --- Included SKUs ---
        '<div class="tp-review-section">' +
        '<div class="tp-review-head">' +
        '<span class="tp-review-title">Core Services</span>' +
        '<span class="tp-review-count">' + groups.required.length + ' included</span>' +
        '</div>' +
        '<ul class="tp-review-items">' +
        groups.required.map(function (s) {
          return '<li><code>' + esc(s.code) + '</code> — ' + esc(s.name) + '</li>';
        }).join('') +
        '</ul>' +
        '</div>' +

        '<div class="tp-review-section">' +
        '<div class="tp-review-head">' +
        '<span class="tp-review-title">Data Exposure Coverage</span>' +
        '<span class="tp-review-count">' + mods.length + ' selected</span>' +
        '<button class="tp-review-edit" data-goto="1">Edit →</button>' +
        '</div>' +
        '<ul class="tp-review-items">' + itemList(mods, 'None needed') + '</ul>' +
        '</div>' +

        '<div class="tp-review-section">' +
        '<div class="tp-review-head">' +
        '<span class="tp-review-title">Data Exposure Coverage Enhancements</span>' +
        '<span class="tp-review-count">' + modOpts.length + ' selected</span>' +
        '<button class="tp-review-edit" data-goto="1">Edit →</button>' +
        '</div>' +
        '<ul class="tp-review-items">' + itemList(modOpts, 'None needed') + '</ul>' +
        '</div>' +

        '<div class="tp-review-section">' +
        '<div class="tp-review-head">' +
        '<span class="tp-review-title">One-Time Setup</span>' +
        '<span class="tp-review-count">' + (1 + oneOptional.length) + ' included</span>' +
        '</div>' +
        '<ul class="tp-review-items">' +
        '<li><code>INIT-ONBRD</code> — Initialization and Client Champions Onboarding</li>' +
        (oneOptional.length ? itemList(oneOptional, '') : '') +
        '</ul>' +
        '</div>' +

        // --- MSRP Base Pricing ---
        '<div class="tp-summary">' +
        '<div class="tp-summary-row subgroup">MSRP base pricing</div>' +

        '<div class="tp-summary-row">' +
        '<span class="tp-pricing-label">Core Services<br/><span style="font-size:11px;color:var(--med-gray);font-weight:400;">SLA for ' + esc(segLabel) + '</span></span>' +
        '<span>' + fmt(carePrice) + '</span>' +
        '</div>' +

        // Named User License — one sub-line for the modules block, then one
        // per per-user enhancement so the prospect can see exactly what each
        // $/user component contributes to the row total. Per-user values use
        // cent precision so "$X/user × N" reconciles with the line total.
        (function () {
          var pu = TrendzactMath.formatPerUser;
          var modulePerUser = licenseCount > 0 ? moduleTotalAnnual / licenseCount : 0;
          var subLines = [];
          subLines.push(pu(modulePerUser) + '/user × ' + licenseCount.toLocaleString('en-US') + ' licenses (' + moduleNames.length + ' module' + (moduleNames.length !== 1 ? 's' : '') + ')');
          (calc1.lines || []).forEach(function (l) {
            if (l.discountGroup === 'enhancement') {
              subLines.push('+ ' + esc(l.code) + ' ' + pu(l.msrpPerUser) + '/user × ' + licenseCount.toLocaleString('en-US'));
            }
          });
          return '<div class="tp-summary-row">' +
              '<span class="tp-pricing-label">Named User License<br/><span style="font-size:11px;color:var(--med-gray);font-weight:400;line-height:1.6;">' + subLines.join('<br/>') + '</span></span>' +
              '<span>' + fmt(namedUserTotal) + '</span>' +
              '</div>';
        })() +

        (connectorTotal > 0
            ? '<div class="tp-summary-row">' +
              '<span class="tp-pricing-label">Connectors<br/><span style="font-size:11px;color:var(--med-gray);font-weight:400;">' + esc(connectorNames.join(', ')) + ' (flat annual)</span></span>' +
              '<span>' + fmt(connectorTotal) + '</span>' +
              '</div>'
            : '') +

        '<div class="tp-summary-row">' +
        '<span class="tp-pricing-label">One-Time Setup<br/><span style="font-size:11px;color:var(--med-gray);font-weight:400;">' + esc(segLabel) + ' Onboarding' + (otherOneTimeTotal > 0 ? ' + integrations' : '') + '</span></span>' +
        '<span>' + fmt(onbrdPrice + otherOneTimeTotal) + '</span>' +
        '</div>' +

        '<div class="tp-summary-row subgroup">Annual commitment</div>' +

        '<div class="tp-tier-grid">' +
        allTiers.map(function (t) {
          var yrs = t.totals.contractYears;
          var tierLabel = (t.commitment && t.commitment.label) || (yrs + '-year');
          return '<div class="tp-tier-card' + (yrs > 1 ? ' tp-tier-discount' : '') + '">' +
              '<div class="tp-tier-label">' + esc(tierLabel) + '</div>' +
              '<div class="tp-tier-row"><span>Annual recurring</span><span>' + fmt(t.totals.annualRecurringMsrp) + '</span></div>' +
              '<div class="tp-tier-row"><span>One-time setup</span><span>' + fmt(t.totals.oneTimeMsrp) + '</span></div>' +
              '<div class="tp-tier-row tp-tier-total"><span>TCV</span><span>' + fmt(t.totals.tcvMsrp) + '</span></div>' +
              '</div>';
        }).join('') +
        '</div>' +

        // --- Line Items (mirrors PDF page 2 LINE ITEMS table) ---
        // Per-unit column shows $/user for per-user pricing (modules + per-user
        // enhancements). Flat-priced lines (CARE, INIT-ONBRD, connectors) get
        // an em-dash since "per unit" doesn't apply — the Line total IS the price.
        '<div class="tp-summary-row subgroup">Line items</div>' +
        '<table class="tp-line-items">' +
        '<thead><tr><th>SKU</th><th>Description</th><th class="num">Unit price</th><th class="num">Line total</th><th class="num">Timing</th></tr></thead>' +
        '<tbody>' +
        (calc1.lines || []).map(function (l) {
          var nm = l.name || '';
          if (nm.length > 50) nm = nm.slice(0, 49) + '…';
          var timingLabel = l.timing === 'oneTime' ? 'One-time' : 'Annual';
          var unitCell = (l.msrpPerUser && l.msrpPerUser > 0)
              ? TrendzactMath.formatPerUser(l.msrpPerUser) + '/user'
              : '—';
          return '<tr>' +
              '<td><code>' + esc(l.code) + '</code></td>' +
              '<td>' + esc(nm) + '</td>' +
              '<td class="num">' + esc(unitCell) + '</td>' +
              '<td class="num">' + fmt(l.msrpLine) + '</td>' +
              '<td class="num" style="color:var(--med-gray);">' + esc(timingLabel) + '</td>' +
              '</tr>';
        }).join('') +
        '</tbody>' +
        '</table>' +

        '</div>'
    );
  }

  function bindStep3() {
    document.querySelectorAll('[data-goto]').forEach(function (el) {
      el.addEventListener('click', function () {
        var idx = parseInt(el.dataset.goto, 10);
        gotoStep(idx);
      });
    });
  }

  // ==============================================================
  // Channel Worksheet (rendered inline in Step 4)
  // ==============================================================
  function renderChannelWorksheet(allTiers, fmt) {
    var subdomain = detectSubdomain();
    var channelConfig = TrendzactMath.resolveChannelConfig(state.catalog, subdomain);
    var channelLabel = subdomain
      ? subdomain.toUpperCase()
      : (channelConfig.label || 'INDIRECT').toUpperCase();
    var calc1 = allTiers[0] || {};
    var t1 = calc1.totals || {};

    var html = '<div class="tp-channel-worksheet">';
    html += '<div class="tp-channel-head">';
    html += '<span class="tp-channel-title">Distributor\u2013Reseller Worksheet</span>';
    html += '<span class="tp-channel-label">' + esc(channelLabel) + '</span>';
    html += '</div>';

    html += '<div class="tp-channel-discounts">';
      html += '<span>Distributor discount (regular): <strong>' + Math.round(channelConfig.regularDistDiscount * 100) + '%</strong></span>';
      html += '<span>Reseller discount (regular): <strong>' + Math.round(channelConfig.regularResellerDiscount * 100) + '%</strong></span>';
      html += '<span>Distributor discount (enhancement): <strong>' + Math.round(channelConfig.enhDistDiscount * 100) + '%</strong></span>';
      html += '<span>Reseller discount (enhancement): <strong>' + Math.round(channelConfig.enhResellerDiscount * 100) + '%</strong></span>';
      html += '</div>';

      // Margin summary table — all 3 tiers
      html += '<div class="tp-channel-margin-title">MARGIN SUMMARY WITH ANNUAL COMMITMENT OPTIONS</div>';
      html += '<table class="tp-channel-table"><thead><tr><th></th>';
      allTiers.forEach(function (t) {
        var pctOff = Math.round((1 - t.commitment.factor) * 100);
        html += '<th>' + t.totals.contractYears + '-year' + (pctOff > 0 ? ' (' + pctOff + '% off)' : '') + '</th>';
      });
      html += '</tr></thead><tbody>';

      // --- RECURRING ---
      html += '<tr class="tp-channel-subhead"><td colspan="' + (allTiers.length + 1) + '">RECURRING</td></tr>';

      // MSRP per Year (annual recurring for each tier)
      html += '<tr><td>MSRP per Year</td>';
      allTiers.forEach(function (t) {
        html += '<td>' + fmt(t.totals.annualRecurringMsrp || 0) + '</td>';
      });
      html += '</tr>';

      // MSRP Commitment (annual × years)
      html += '<tr class="tp-channel-highlight"><td>MSRP Commitment</td>';
      allTiers.forEach(function (t) {
        var msrpCommit = (t.totals.annualRecurringMsrp || 0) * (t.totals.contractYears || 1);
        html += '<td>' + fmt(msrpCommit) + '</td>';
      });
      html += '</tr>';

      // Channel splits on MSRP Commitment — use precomputed per-line totals
      // from the math engine so enhancement SKUs (deeper discount) blend in
      // correctly. Commit factor scales both sides equally, so % is tier-independent.
      var t0 = (allTiers[0] && allTiers[0].totals) || {};
      var t0AnnualMsrp = t0.annualRecurringMsrp || 0;
      var blendedTzNetPct = t0AnnualMsrp > 0 ? Math.round((t0.annualTrendzactNet || 0) / t0AnnualMsrp * 100) : 0;
      var blendedDistPct = t0AnnualMsrp > 0 ? Math.round((t0.annualDistRetains || 0) / t0AnnualMsrp * 100) : 0;
      var blendedResellerPct = t0AnnualMsrp > 0 ? Math.round((t0.annualResellerRetains || 0) / t0AnnualMsrp * 100) : 0;

      html += '<tr><td>Trendzact net (' + blendedTzNetPct + '%)</td>';
      allTiers.forEach(function (t) {
        html += '<td>' + fmt((t.totals.annualTrendzactNet || 0) * (t.totals.contractYears || 1)) + '</td>';
      });
      html += '</tr>';

      html += '<tr><td>Distributor retains (' + blendedDistPct + '%)</td>';
      allTiers.forEach(function (t) {
        html += '<td>' + fmt((t.totals.annualDistRetains || 0) * (t.totals.contractYears || 1)) + '</td>';
      });
      html += '</tr>';

      html += '<tr><td>Reseller retains (' + blendedResellerPct + '%)</td>';
      allTiers.forEach(function (t) {
        html += '<td>' + fmt((t.totals.annualResellerRetains || 0) * (t.totals.contractYears || 1)) + '</td>';
      });
      html += '</tr>';

      // --- ONE-TIME ---
      html += '<tr class="tp-channel-subhead"><td colspan="' + (allTiers.length + 1) + '">ONE-TIME</td></tr>';

      var otMsrp = t1.oneTimeMsrp || 0;
      var otTzNet = t1.oneTimeTrendzactNet || 0;
      var otDistRetains = t1.oneTimeDistRetains || 0;
      var otResellerRetains = t1.oneTimeResellerRetains || 0;
      var otTzPct = otMsrp > 0 ? Math.round((otTzNet / otMsrp) * 100) : 0;
      var otDistPct = otMsrp > 0 ? Math.round((otDistRetains / otMsrp) * 100) : 0;
      var otResellerPct = otMsrp > 0 ? Math.round((otResellerRetains / otMsrp) * 100) : 0;

      html += '<tr class="tp-channel-highlight"><td>MSRP</td>';
      allTiers.forEach(function () { html += '<td>' + fmt(otMsrp) + '</td>'; });
      html += '</tr>';

      html += '<tr><td>Trendzact net (' + otTzPct + '%)</td>';
      allTiers.forEach(function () { html += '<td>' + fmt(otTzNet) + '</td>'; });
      html += '</tr>';

      html += '<tr><td>Distributor retains (' + otDistPct + '%)</td>';
      allTiers.forEach(function () { html += '<td>' + fmt(otDistRetains) + '</td>'; });
      html += '</tr>';

      html += '<tr><td>Reseller retains (' + otResellerPct + '%)</td>';
      allTiers.forEach(function () { html += '<td>' + fmt(otResellerRetains) + '</td>'; });
      html += '</tr>';

      // --- TOTAL (recurring commitment + one-time) ---
      html += '<tr class="tp-channel-subhead"><td colspan="' + (allTiers.length + 1) + '">TOTAL (RECURRING + ONE-TIME)</td></tr>';

      html += '<tr class="tp-channel-highlight"><td>Trendzact net total</td>';
      allTiers.forEach(function (t) {
        var recCommitTzNet = (t.totals.annualTrendzactNet || 0) * (t.totals.contractYears || 1);
        html += '<td>' + fmt(recCommitTzNet + otTzNet) + '</td>';
      });
      html += '</tr>';

      html += '<tr class="tp-channel-highlight"><td>Distributor retains total</td>';
      allTiers.forEach(function (t) {
        var recCommitDistRetains = (t.totals.annualDistRetains || 0) * (t.totals.contractYears || 1);
        html += '<td>' + fmt(recCommitDistRetains + otDistRetains) + '</td>';
      });
      html += '</tr>';

      html += '<tr class="tp-channel-highlight"><td>Reseller retains total</td>';
      allTiers.forEach(function (t) {
        var recCommitResellerRetains = (t.totals.annualResellerRetains || 0) * (t.totals.contractYears || 1);
        html += '<td>' + fmt(recCommitResellerRetains + otResellerRetains) + '</td>';
      });
      html += '</tr>';

    html += '</tbody></table>';

    html += '<p class="tp-hint" style="margin-top:8px;font-style:italic;">Partner internal use \u2014 not included in prospect-facing pages.</p>';
    html += '</div>';
    return html;
  }

  // ==============================================================
  // STEP 4 — Save & Submit
  // ==============================================================
  function renderSubmit() {
    var allTiers = state._allTiers || TrendzactMath.calculateAllTiers(buildDraftForMathEngine(1), state.catalog);
    state._allTiers = allTiers;
    state._lastCalc = allTiers[0];
    var d = state.draft;
    var fmt = TrendzactMath.formatMoney;
    var userEmail = (state.user && state.user.email) || 'partner.user@example.com';

    var defaultTitle = d.proposalTitle || (d.prospectCompany ? 'Proposal for ' + d.prospectCompany : '');

    var banner = '';
    if (state.submitResult) {
      var er = state.submitResult.emailResult || {};
      var emailLine;
      if (er.ok) {
        var ccPart = (d.ccTo && d.ccTo.trim()) ? ' and CC\'d to ' + esc(d.ccTo.trim()) : '';
        emailLine = '<br/>Email copy sent to <code>' + esc(state.user && state.user.email || 'you') + '</code>' + ccPart + '.';
      } else {
        emailLine = '<br/><span style="color:#B45309;">Email could not be sent (' + esc(er.code || 'unknown') + '): ' + esc(er.error || 'unknown error') + '. Your PDF downloaded successfully; the proposal ID is saved.</span>';
      }
      banner = '<div class="tp-banner tp-banner-success">' +
          'Submitted. Proposal <code>' + esc(state.submitResult.proposalId) + '</code> downloaded as ' +
          '<strong>' + esc(state.submitResult.filename) + '</strong>.' +
          emailLine +
          '<br/>Draft has been cleared.' +
          '</div>';
    }

    return (
        '<h3>Step 4 — Save &amp; Submit</h3>' +
        '<p class="tp-lede">The PDF includes all three commitment options (1-year, 2-year, 3-year) so the prospect can present them to Procurement. Deal Desk is BCC\'d for pipeline tracking.</p>' +

        '<div class="tp-submit-panel">' +
        '<div class="tp-submit-header">' +
        '<div style="flex:1;">' +
        '<div class="tp-submit-hero-label">Proposal ID (assigned on submit)</div>' +
        '<div class="tp-uuid' + (state.submitResult ? '' : ' pending') + '">' +
        esc(state.submitResult ? state.submitResult.proposalId : '— pending —') +
        '</div>' +
        '</div>' +
        '</div>' +

        '<div class="tp-submit-field">' +
        '<label>Proposal Title<span class="req">*</span></label>' +
        '<input type="text" id="sf-title" value="' + esc(defaultTitle) + '" placeholder="e.g., Proposal for Acme Manufacturing"/>' +
        '<p class="tp-hint" style="margin-top:4px;">Appears on the PDF cover.</p>' +
        '</div>' +

        '<div class="tp-submit-field">' +
        '<label>Generated By</label>' +
        '<div class="tp-text-display">' + esc(userEmail) + '</div>' +
        '<p class="tp-hint" style="margin-top:4px;">Partner email is stamped on the PDF footer.</p>' +
        '</div>' +

        '<div class="tp-submit-field">' +
        '<label>CC To (optional)</label>' +
        '<input type="text" id="sf-cc" value="' + esc(d.ccTo) + '" placeholder="colleague@yourco.com, team@yourco.com"/>' +
        '<p class="tp-hint" style="margin-top:4px;">Comma- or semicolon-separated. These addresses will be CC\'d on the email copy of this proposal.</p>' +
        '</div>' +

        renderChannelWorksheet(allTiers, fmt) +

        '<div class="tp-submit-row">' +
        '<button type="button" class="danger" id="tp-clear">Clear — Start Over</button>' +
        '<button type="button" class="primary" id="tp-submit"' + (state.submitResult ? ' disabled' : '') + '>Submit, Download &amp; Email</button>' +
        '</div>' +

        banner +
        '</div>'
    );
  }

  function bindStep4() {
    var titleInp = document.getElementById('sf-title');
    if (titleInp) titleInp.addEventListener('input', function () {
      state.draft.proposalTitle = titleInp.value;
      scheduleAutosave();
    });
    var ccInp = document.getElementById('sf-cc');
    if (ccInp) ccInp.addEventListener('input', function () {
      state.draft.ccTo = ccInp.value;
      scheduleAutosave();
    });
    var clearBtn = document.getElementById('tp-clear');
    if (clearBtn) clearBtn.addEventListener('click', function () {
      if (!confirm('Clear this proposal and start a new one? This cannot be undone.')) return;
      clearDraftDoc().then(function () {
        state.submitResult = null;
        startFresh();
      });
    });
    var submitBtn = document.getElementById('tp-submit');
    if (submitBtn) submitBtn.addEventListener('click', onSubmit);
  }

  async function onSubmit() {
    if (!state.draft.proposalTitle || !state.draft.proposalTitle.trim()) {
      alert('Please enter a proposal title.');
      return;
    }
    // Re-verify the math engine has no blocking errors. The Step 3 review
    // already surfaces these inline, but the user can still navigate to
    // Step 4 via the chip — refuse to render a PDF that wouldn't reconcile.
    var preflight = TrendzactMath.calculateAllTiers(buildDraftForMathEngine(1), state.catalog);
    if (preflight[0] && preflight[0].hasErrors) {
      alert('Cannot submit — pricing has errors:\n  · ' + (preflight[0].errors || []).join('\n  · ') + '\n\nReturn to Review (Step 3) to fix.');
      return;
    }
    var ccDescription = state.draft.ccTo && state.draft.ccTo.trim()
        ? '. A copy will be emailed to you (CC: ' + state.draft.ccTo.trim() + ')'
        : '. A copy will be emailed to you';
    if (!confirm('Generate and download the proposal PDF with all commitment options' + ccDescription + '? The draft will be cleared on success.')) return;

    var panel = document.getElementById('tp-panel');
    panel.innerHTML =
        '<div style="text-align:center; padding: 60px 20px;">' +
        '<div class="tp-spinner"></div>' +
        '<h3>Generating proposal…</h3>' +
        '<p class="tp-lede">Building PDF for ' + esc(state.draft.prospectCompany) + ' and sending email.</p>' +
        '</div>';

    try {
      var draftForEngine = buildDraftForMathEngine(1);
      var allTiers = TrendzactMath.calculateAllTiers(draftForEngine, state.catalog);
      var result = window.TrendzactProposalRender.render({
        draft: draftForEngine,
        allTiers: allTiers,
        catalog: state.catalog,
        partnerEmail: (state.user && state.user.email) || '',
        ccTo: state.draft.ccTo || ''
      });
      // PDF download has already been triggered by render().
      // Wait for the email result so we can report both outcomes.
      var emailResult = await result.emailPromise;
      state.submitResult = {
        proposalId: result.proposalId,
        filename: result.filename,
        emailResult: emailResult
      };
      await clearDraftDoc();
      gotoStep(3);   // Re-render Step 4 to show success banner
    } catch (e) {
      console.error('[TP Wizard] submit failed', e);
      panel.innerHTML =
          '<div style="text-align:center; padding: 60px 20px;">' +
          '<h3>Could not generate proposal</h3>' +
          '<p class="tp-lede">' + esc(e.message || String(e)) + '</p>' +
          '<button type="button" class="primary" onclick="location.reload()">Reload</button>' +
          '</div>';
    }
  }

  // --------------------------------------------------------------
  // Step handler dispatch
  // --------------------------------------------------------------
  function bindStepHandlers() {
    var stepId = STEPS[state.step].id;
    if (stepId === 'fields') bindStep1();
    else if (stepId === 'selectors') bindStep2();
    else if (stepId === 'review') bindStep3();
    else if (stepId === 'submit') bindStep4();
  }

  // --------------------------------------------------------------
  // Utilities
  // --------------------------------------------------------------
  function esc(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function timeAgo(iso) {
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

  function renderFatalError(msg) {
    var mount = document.getElementById('wizard-mount');
    if (!mount) return;
    mount.innerHTML =
        '<div class="tp-section-blocker" style="font-size:14px; padding: 20px;">' +
        '<strong>Could not start the Proposal Builder.</strong>' +
        '<p style="margin-top:8px;">' + esc(msg) + '</p>' +
        '</div>';
  }

  // --------------------------------------------------------------
  // Public surface
  // --------------------------------------------------------------
  window.TrendzactWizard = {
    init: init
  };
})();