// Trendzact Partners — Proposal Wizard (v5-style, v6 catalog)
//
// Rebuilt against mockup v5 interaction model:
//   - 4 steps: Proposal Fields | Solution Selectors | Review & Calculate | Save & Submit
//   - Horizontal step chips, not numbered circles
//   - Collapsible sections (Required/Modules/Platform/One-Time) with count pills
//   - Modules rendered as accordions with inline features and nested option rows
//   - "None needed" acknowledgment checkboxes per optional section
//   - Field-level inline errors, section-level blockers
//   - Step 4 = Submit panel with proposal title, CC-to, UUID chip
//
// Reads the real v6 catalog from /catalog.json. Math is delegated to
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
    'contactEmail', 'companySegment', 'sector', 'expectedLicenseCount',
    'estDecisionDate', 'termYears', 'solutionChallenge'
  ];

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
      sector: 'commercial',
      expectedLicenseCount: '',
      estDecisionDate: '',
      termYears: '',
      solutionChallenge: '',

      // Step 2 — Solution Selectors
      sectionOpen: { core: true, modules: true, platform: true, oneTime: true },
      sectionNone: { modules: false, platform: false, oneTime: false },
      moduleExpanded: [],        // array of module codes that are open
      selectedModules: [],       // module codes
      selectedModuleOptions: [], // option codes
      selectedPlatform: [],      // platform option codes
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
         // Keep URL in a variable to avoid IDE unresolved-literal inspection noise.
         var firestoreCdnUrl = 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
         // @ts-ignore - External CDN module, resolves at runtime in browser.
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

    if (existingDraft && existingDraft.prospectCompany) {
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
    modal.innerHTML =
      '<div class="tp-modal">' +
        '<h3>Continue where you left off?</h3>' +
        '<p>You have an in-progress proposal for <strong>' + esc(existing.prospectCompany) + '</strong>' +
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
          if (k in merged) merged[k] = existing[k];
        });
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
      '<p class="tp-lede">Capture the prospect, company size, and pricing term. All fields are required.</p>' +
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
        selectHtml('Sector', 'f-sector',
                   '<option value="commercial"' + (d.sector === 'commercial' ? ' selected' : '') + '>Commercial</option>' +
                   '<option value="govt-public-works"' + (d.sector === 'govt-public-works' ? ' selected' : '') + '>Govt / Public Works</option>',
                   'Defaults to Commercial. Govt/public-works affects contract terms downstream.', 'sector') +
        fieldHtml('Expected License Count (annual named user)', 'f-licenses', 'number', d.expectedLicenseCount,
                  '500', 'Per-named-user licensing is the v1 model.', 'expectedLicenseCount', 'min="1"') +
        fieldHtml('Est. Decision Date (YYYY-MM)', 'f-decision', 'month', d.estDecisionDate,
                  '', 'Month-level precision is fine for pipeline.', 'estDecisionDate') +
        selectHtml('Term (years)', 'f-term',
                   '<option value="">— Select a term —</option>' +
                   '<option value="1"' + (String(d.termYears) === '1' ? ' selected' : '') + '>1 year</option>' +
                   '<option value="2"' + (String(d.termYears) === '2' ? ' selected' : '') + '>2 years (continuity discount)</option>' +
                   '<option value="3"' + (String(d.termYears) === '3' ? ' selected' : '') + '>3 years (deeper continuity discount)</option>',
                   'Multi-year applies continuity discounts to recurring line items only.', 'termYears') +
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
      var typeAttr = 'type="text"';
      if (type === 'email') typeAttr = 'type="email"';
      else if (type === 'number') typeAttr = 'type="number"';
      else if (type === 'month') typeAttr = 'type="month"';
     return '<div class="tp-field">' +
            '<label>' + label + '<span class="req">*</span></label>' +
              '<input ' + typeAttr + ' id="' + id + '" value="' + esc(val) + '" placeholder="' + esc(ph) + '" class="' + fieldCls(key) + '" ' + extra + '/>' +
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
      'f-seg': 'companySegment', 'f-sector': 'sector',
      'f-licenses': 'expectedLicenseCount', 'f-decision': 'estDecisionDate',
      'f-term': 'termYears', 'f-challenge': 'solutionChallenge'
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
         return s.category === '10-Data Exposure Coverage' || s.category === '10-Module';
       }).sort(byDisplayOrder),
      platform: cat.filter(function (s) {
        return s.category === '25-Platform Option Recurring';
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

   function sectionStatus(id) {
    var d = state.draft;
    if (id === 'core') {
      var ct = catalogByCategory().required.length;
      return { label: ct + ' included', klass: 'ok' };
    }
    var count = 0;
    if (id === 'modules') count = d.selectedModules.length;
    else if (id === 'platform') count = d.selectedPlatform.length;
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

       var rightSide;
       if (beta) {
         rightSide = '';
       } else if (childSelectedCount > 0) {
         rightSide = '<span class="tp-sku-opt-count">+' + childSelectedCount + ' option' + (childSelectedCount > 1 ? 's' : '') + '</span>';
       } else {
         rightSide = '';
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
              optsHtml += '<p class="tp-hint" style="margin-top:6px;">Select the parent module to enable these options.</p>';
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

    // Platform Options section
    var platformCount = d.selectedPlatform.length;
    var platformNone =
      '<div class="tp-none-row">' +
        '<input type="checkbox" id="none-platform" ' +
          (d.sectionNone.platform ? 'checked' : '') +
          (platformCount > 0 ? ' disabled' : '') + '/>' +
        '<label for="none-platform">None needed for this opportunity (acknowledge to proceed)</label>' +
      '</div>';

    var platformHtml = groups.platform.map(function (p) {
      var sel = d.selectedPlatform.indexOf(p.code) !== -1;
      var disabled = d.sectionNone.platform && !sel;
      return '<div class="tp-sku-row' + (sel ? ' selected' : '') + (disabled ? ' disabled' : '') + '" data-platform="' + esc(p.code) + '">' +
               '<input type="checkbox" ' + (sel ? 'checked' : '') + (disabled ? ' disabled' : '') + '/>' +
               '<div class="tp-sku-body">' +
                  '<div class="tp-sku-line">' +
                    '<span class="tp-sku-code">' + esc(p.code) + '</span>' +
                    '<span class="tp-sku-name">' + esc(p.name) + '</span>' +
                  '</div>' +
                 '<p class="tp-sku-desc">' + esc(p.description || '') + '</p>' +
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
      return '<div class="' + classes + '" data-section="' + id + '">' +
               '<div class="tp-section-toggle" data-section-toggle="' + id + '">' +
                 '<span class="tp-section-caret">▶</span>' +
                 '<span class="tp-section-title">' + esc(title) + '</span>' +
                 '<span class="tp-section-count ' + (st.klass || '') + '">' + esc(st.label) + '</span>' +
               '</div>' +
                (d.sectionOpen[id] ? '<div class="tp-section-body">' + (subtext ? '<p class="tp-lede">' + esc(subtext) + '</p>' : '') + bodyInnerHtml + '</div>' : '') +
             '</div>';
    }

    var blocker = '';
    if (state.draft.sectionErrors && Object.keys(state.draft.sectionErrors).length) {
      blocker = '<div class="tp-section-blocker">Every optional section needs at least one selection or a "None needed" acknowledgment before continuing.</div>';
    }

     return (
       '<h3>Step 2 — Solution Selectors</h3>' +
       '<p class="tp-lede">Select coverage areas for the prospect. If a section does not apply, check "None needed" to acknowledge.</p>' +

       sectionHtml('core', 'Core Services', coreHtml) +
       sectionHtml(
         'modules',
         'Select Your Data Exposure Coverage',
         modulesNone + modulesHtml,
         'Define where sensitive data is exposed—and apply real-time protection'
       ) +
       sectionHtml('platform', 'Platform Infrastructure', platformNone + platformHtml) +
       sectionHtml('oneTime', 'Initialization & Integrations', oneTimeNone + oneTimeHtml) +
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

    // Platform option rows — entire row clickable
    document.querySelectorAll('[data-platform]').forEach(function (el) {
      el.addEventListener('click', function () {
        if (el.classList.contains('disabled')) return;
        var code = el.dataset.platform;
        var i = d.selectedPlatform.indexOf(code);
        if (i === -1) {
          d.selectedPlatform.push(code);
          d.sectionNone.platform = false;
        } else {
          d.selectedPlatform.splice(i, 1);
        }
        if (d.sectionErrors && d.sectionErrors.platform) delete d.sectionErrors.platform;
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

    var nonePlat = document.getElementById('none-platform');
    if (nonePlat) nonePlat.addEventListener('change', function () {
      d.sectionNone.platform = nonePlat.checked;
      if (d.sectionErrors && d.sectionErrors.platform) delete d.sectionErrors.platform;
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
    if (d.selectedModules.length === 0 && !d.sectionNone.modules) errs.modules = true;
    if (d.selectedPlatform.length === 0 && !d.sectionNone.platform) errs.platform = true;
    var optOneTime = d.selectedOneTime.filter(function (c) { return c !== 'INIT-ONBRD'; });
    if (optOneTime.length === 0 && !d.sectionNone.oneTime) errs.oneTime = true;
    d.sectionErrors = errs;
    return Object.keys(errs).length === 0;
  }

  // ==============================================================
  // STEP 3 — Review & Calculate
  // ==============================================================
  function buildDraftForMathEngine() {
    var d = state.draft;
    // Aggregate all selections into the draft format the math engine expects
    var selected = []
      .concat(d.selectedModules)
      .concat(d.selectedModuleOptions)
      .concat(d.selectedPlatform)
      .concat(d.selectedOneTime);
    return {
      companyName: d.prospectCompany,
      contactName: d.primaryContactName,
      primaryUseCase: d.solutionChallenge,
      dealStage: 'Proposal',
      estimatedCloseDate: d.estDecisionDate,
      sector: d.sector,
      companySegment: d.companySegment,
      userCount: parseInt(d.expectedLicenseCount, 10) || 0,
      contractYears: parseInt(d.termYears, 10) || 1,
      selectedSkuCodes: selected,
      notes: ''
    };
  }

  function renderReview() {
    var d = state.draft;
    var engineDraft = buildDraftForMathEngine();
    var calc = TrendzactMath.calculateProposal(engineDraft, state.catalog);
    state._lastCalc = calc;
    var fmt = TrendzactMath.formatMoney;

    var seg = state.catalog.companySizeSegments.find(function (s) { return s.key === d.companySegment; });
    var segLabel = seg ? seg.label + ' (' + seg.headcountRange + ')' : '—';

    // Prospect snapshot
    var prospectLine = [
      d.prospectCompany || '—',
      d.primaryContactName + (d.primaryContactRole ? ', ' + d.primaryContactRole : ''),
      segLabel,
      (d.expectedLicenseCount || '—') + ' licenses',
      (d.termYears || '—') + 'yr term'
    ].filter(Boolean).join(' · ');

    var mods = d.selectedModules;
    var modOpts = d.selectedModuleOptions;
    var plat = d.selectedPlatform;
    var one = d.selectedOneTime.filter(function (c) { return c !== 'INIT-ONBRD'; });

    var skuName = function (code) {
      var s = state.catalog.skus.find(function (x) { return x.code === code; });
      return s ? s.name : code;
    };

    var errorsHtml = '';
    if (calc.errors && calc.errors.length) {
      errorsHtml = '<div class="tp-section-blocker">Cannot calculate: ' + calc.errors.map(esc).join('; ') + '</div>';
    }

    var summaryRows = [];
    summaryRows.push('<div class="tp-summary-row"><span class="tp-pricing-label">Recurring subtotal (list)</span><span>' + fmt(calc.totals.recurringListUsd) + '</span></div>');
    if (calc.bundleDiscount.discountAmountUsd > 0) {
      summaryRows.push('<div class="tp-summary-row discount"><span class="tp-pricing-label">Bundle discount (' + calc.bundleDiscount.eligibleModuleCount + ' modules, ' + calc.bundleDiscount.discountPct + '%)</span><span>−' + fmt(calc.bundleDiscount.discountAmountUsd) + '</span></div>');
    }
    summaryRows.push('<div class="tp-summary-row subgroup">Annual recurring by year</div>');
    summaryRows.push('<div class="tp-summary-row"><span class="tp-pricing-label">Year 1</span><span>' + fmt(calc.totals.recurringYear1Usd) + '</span></div>');
    if (calc.totals.contractYears >= 2) {
      summaryRows.push('<div class="tp-summary-row discount"><span class="tp-pricing-label">Year 2 (' + (100 - calc.multiYearContinuity.year2Pct) + '% of Y1)</span><span>' + fmt(calc.totals.recurringYear2Usd) + '</span></div>');
    }
    if (calc.totals.contractYears >= 3) {
      summaryRows.push('<div class="tp-summary-row discount"><span class="tp-pricing-label">Year 3 (' + (100 - calc.multiYearContinuity.year3Pct) + '% of Y1)</span><span>' + fmt(calc.totals.recurringYear3Usd) + '</span></div>');
    }
    summaryRows.push('<div class="tp-summary-row subgroup">One-time setup</div>');
    summaryRows.push('<div class="tp-summary-row onetime"><span class="tp-pricing-label">Total one-time setup</span><span>' + fmt(calc.totals.oneTimeUsd) + '</span></div>');
    summaryRows.push('<div class="tp-summary-row total"><span>Total contract value (' + calc.totals.contractYears + 'yr)</span><span>' + fmt(calc.totals.tcvUsd) + '</span></div>');

    var itemList = function (codes, emptyText) {
      if (!codes.length) return '<li style="color:var(--med-gray);">' + esc(emptyText) + '</li>';
      return codes.map(function (c) {
        return '<li><code>' + esc(c) + '</code> — ' + esc(skuName(c)) + '</li>';
      }).join('');
    };

    return (
      '<h3>Step 3 — Review &amp; Calculate</h3>' +
      '<p class="tp-lede">Live totals. Click any "Edit →" link to jump back and adjust.</p>' +

      errorsHtml +

      '<div class="tp-review-section">' +
        '<div class="tp-review-head">' +
          '<span class="tp-review-title">Prospect</span>' +
          '<button class="tp-review-edit" data-goto="0">Edit →</button>' +
        '</div>' +
        '<div style="font-size:12px;color:var(--med-gray);margin-top:4px;">' + esc(prospectLine) + '</div>' +
      '</div>' +

      '<div class="tp-review-section">' +
        '<div class="tp-review-head">' +
          '<span class="tp-review-title">Core Services</span>' +
          '<span class="tp-review-count">Always included</span>' +
        '</div>' +
        '<ul class="tp-review-items">' +
          catalogByCategory().required.map(function (s) {
            return '<li><code>' + esc(s.code) + '</code> — ' + esc(s.name) + '</li>';
          }).join('') +
        '</ul>' +
      '</div>' +

       '<div class="tp-review-section">' +
         '<div class="tp-review-head">' +
           '<span class="tp-review-title">Data Exposure Coverage</span>' +
           '<span class="tp-review-count">' + mods.length + ' selected' + (d.sectionNone.modules ? ' (none needed)' : '') + '</span>' +
          '<button class="tp-review-edit" data-goto="1">Edit →</button>' +
        '</div>' +
        '<ul class="tp-review-items">' + itemList(mods, 'None needed') + '</ul>' +
      '</div>' +

       '<div class="tp-review-section">' +
         '<div class="tp-review-head">' +
           '<span class="tp-review-title">Enhancements</span>' +
           '<span class="tp-review-count">' + modOpts.length + ' selected</span>' +
        '</div>' +
        '<ul class="tp-review-items">' + itemList(modOpts, 'None') + '</ul>' +
      '</div>' +

       '<div class="tp-review-section">' +
         '<div class="tp-review-head">' +
           '<span class="tp-review-title">Platform Infrastructure</span>' +
           '<span class="tp-review-count">' + plat.length + ' selected' + (d.sectionNone.platform ? ' (none needed)' : '') + '</span>' +
        '</div>' +
        '<ul class="tp-review-items">' + itemList(plat, 'None needed') + '</ul>' +
      '</div>' +

       '<div class="tp-review-section">' +
         '<div class="tp-review-head">' +
           '<span class="tp-review-title">Initialization & Integrations</span>' +
           '<span class="tp-review-count">' + one.length + ' selected' + (d.sectionNone.oneTime ? ' (no add-ons needed)' : '') + '</span>' +
        '</div>' +
        '<ul class="tp-review-items">' +
          '<li><code>INIT-ONBRD</code> — Initialization and Client Champions Onboarding</li>' +
          itemList(one, '').replace(/<li style="[^"]+">.*?<\/li>/, '') +
        '</ul>' +
      '</div>' +

      '<div class="tp-summary">' +
        summaryRows.join('') +
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
  // STEP 4 — Save & Submit
  // ==============================================================
  function renderSubmit() {
    var calc = state._lastCalc || TrendzactMath.calculateProposal(buildDraftForMathEngine(), state.catalog);
    state._lastCalc = calc;
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
      '<p class="tp-lede">Submit assigns a proposal ID, downloads the PDF to your browser, and emails you a copy with the PDF attached. Deal Desk is BCC\'d for pipeline tracking.</p>' +

      '<div class="tp-submit-panel">' +
        '<div class="tp-submit-header">' +
          '<div>' +
            '<div class="tp-submit-hero-label">Total contract value (' + calc.totals.contractYears + 'yr)</div>' +
            '<div class="tp-submit-hero-value">' + fmt(calc.totals.tcvUsd) + '</div>' +
          '</div>' +
          '<div style="text-align:right;">' +
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
    var ccDescription = state.draft.ccTo && state.draft.ccTo.trim()
      ? '. A copy will be emailed to you (CC: ' + state.draft.ccTo.trim() + ')'
      : '. A copy will be emailed to you';
    if (!confirm('Generate and download the proposal PDF' + ccDescription + '? The draft will be cleared on success.')) return;

    var panel = document.getElementById('tp-panel');
    panel.innerHTML =
      '<div style="text-align:center; padding: 60px 20px;">' +
        '<div class="tp-spinner"></div>' +
        '<h3>Generating proposal…</h3>' +
        '<p class="tp-lede">Building PDF for ' + esc(state.draft.prospectCompany) + ' and sending email.</p>' +
      '</div>';

    try {
      var calc = state._lastCalc || TrendzactMath.calculateProposal(buildDraftForMathEngine(), state.catalog);
      var result = window.TrendzactProposalRender.render({
        draft: buildDraftForMathEngine(),
        calculation: calc,
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
