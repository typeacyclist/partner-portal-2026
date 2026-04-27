// Trendzact Proposal Builder V2 - catalog-mapped wizard
(function () {
  'use strict';

  var STEPS = [
    ['scope', '01', 'Customer Scope'],
    ['solutions', '02', 'Solutions'],
    ['review', '03', 'Review & Calculate'],
    ['submit', '04', 'PDF & Email']
  ];

  var SOLUTIONS = [
    ['SW', 'Secure Workspace', 'SWA', 'Control visual, physical, observer, mobile-phone, and unattended-workstation exposure.'],
    ['IRA', 'Identity Recognition Assurance', 'SIA', 'Confirm the right person is present while sensitive data is visible.'],
    ['SVM', 'Secure Virtual Meeting', 'SVM', 'Control sensitive data exposure during virtual meetings and screen sharing.'],
    ['ITM', 'Insider Threat Management', 'ITM', 'MITRE ATT&CK-aligned rules for stealthy authorized-user misuse.'],
    ['EDLP', 'Exposure Data Loss Prevention', null, 'EDLP catalog SKU is not active yet; select ITM, SVM, SW, and/or connectors until EDLP is activated.']
  ];

  var ADDONS = [
    ['ultrawide', 'Trendzact Ultrawide Webcam', 'UVA-WEBCAM', 'Applies to Secure Workspace only; priced as an enablement/service SKU.'],
    ['privacyScreen', 'Privacy Screen', 'PRIVSCR', 'Per monitored user service/enhancement SKU.']
  ];

  var REGULATED = [
    ['Government / Public Sector', null],
    ['EU Territory / GDPR', 'INIT-DPIA'],
    ['Works Council', 'INIT-DPIA'],
    ['PCI DSS', 'INIT-DPIA'],
    ['HIPAA', 'INIT-DPIA'],
    ['Data Residency', 'PLAT-AWSACC'],
    ['Evidence Retention', 'MSR'],
    ['DPIA / Privacy Review', 'INIT-DPIA']
  ];

  var state = {
    step: 0,
    catalog: null,
    calculation: null,
    draft: {
      companyName: '',
      contactName: '',
      contactEmail: '',
      primaryUseCase: 'Sensitive Data Exposure Control',
      dealStage: 'Draft',
      estimatedCloseDate: '',
      userCount: 100,
      companySegment: '',
      sector: 'commercial',
      contractYears: 1,
      proposalTitle: 'Trendzact SDEC Proposal',
      notes: '',
      ccTo: '',
      partnerEmail: '',
      selectedSolutions: [],
      selectedRegulated: [],
      addOns: { ultrawide: false, privacyScreen: false }
    },
    outputText: ''
  };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function fmt(n) { return window.TrendzactMath ? window.TrendzactMath.formatMoney(n) : '$' + Math.round(n || 0).toLocaleString('en-US'); }
  function toggle(arr, val, yes) { var i = arr.indexOf(val); if (yes && i < 0) arr.push(val); if (!yes && i >= 0) arr.splice(i, 1); }
  function activeSku(code) { return state.catalog && state.catalog.skus && state.catalog.skus.find(function (s) { return s.code === code && s.isActive !== false; }); }

  function init() {
    fetch('/catalog.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('Catalog HTTP ' + r.status); return r.json(); })
      .then(function (catalog) {
        state.catalog = catalog;
        if (!state.draft.companySegment && catalog.companySizeSegments && catalog.companySizeSegments.length) {
          state.draft.companySegment = catalog.companySizeSegments[0].key;
        }
        var user = window.TrendzactAuth && window.TrendzactAuth.currentUser;
        if (user && user.email && !state.draft.partnerEmail) state.draft.partnerEmail = user.email;
        render();
      })
      .catch(function (e) {
        var mount = document.getElementById('pbv2-form');
        if (mount) mount.innerHTML = '<div class="pbv2-warning">Could not load catalog.json: ' + esc(e.message) + '</div>';
      });
  }

  function mappedSkuCodes() {
    var codes = [];
    state.draft.selectedSolutions.forEach(function (code) {
      var item = SOLUTIONS.find(function (s) { return s[0] === code; });
      if (item && item[2] && activeSku(item[2])) codes.push(item[2]);
    });
    ADDONS.forEach(function (a) {
      if (state.draft.addOns[a[0]] && activeSku(a[2])) codes.push(a[2]);
    });
    state.draft.selectedRegulated.forEach(function (label) {
      var item = REGULATED.find(function (r) { return r[0] === label; });
      if (item && item[1] && activeSku(item[1])) codes.push(item[1]);
    });
    if (state.draft.selectedRegulated.indexOf('Evidence Retention') >= 0 && activeSku('MSR-ALERT')) codes.push('MSR-ALERT');
    return codes.filter(function (c, i, a) { return a.indexOf(c) === i; });
  }

  function calc() {
    if (!state.catalog || !window.TrendzactMath) return null;
    var d = state.draft;
    var mathDraft = {
      companySegment: d.companySegment,
      userCount: d.userCount,
      contractYears: d.contractYears,
      selectedSkuCodes: mappedSkuCodes()
    };
    state.calculation = window.TrendzactMath.calculateProposal(mathDraft, state.catalog);
    return state.calculation;
  }

  function render() {
    renderStepbar();
    calc();
    renderSummary();
    var title = document.getElementById('pbv2-panel-title');
    var hint = document.getElementById('pbv2-panel-hint');
    var mount = document.getElementById('pbv2-form');
    if (!mount) return;
    title.textContent = STEPS[state.step][2];
    hint.textContent = state.step === 0 ? 'Required proposal fields for the PDF and pricing engine.' :
      state.step === 1 ? 'SDEC solution labels mapped to active catalog SKU codes.' :
      state.step === 2 ? 'Review mapped catalog selections before creating the proposal.' :
      'Download PDF and submit through the existing v1 email endpoint.';
    if (state.step === 0) mount.innerHTML = renderScope();
    if (state.step === 1) mount.innerHTML = renderSolutions();
    if (state.step === 2) mount.innerHTML = renderReview();
    if (state.step === 3) mount.innerHTML = renderSubmit();
    bind();
  }

  function renderStepbar() {
    var sb = document.getElementById('pbv2-stepbar');
    if (!sb) return;
    sb.innerHTML = STEPS.map(function (s, i) {
      return '<div class="pbv2-step ' + (i === state.step ? 'active' : '') + '"><small>Step ' + s[1] + '</small><strong>' + esc(s[2]) + '</strong></div>';
    }).join('');
  }

  function field(label, key, type, wide) {
    return '<div class="pbv2-field ' + (wide ? 'pbv2-wide' : '') + '"><label>' + esc(label) + '</label><input data-field="' + esc(key) + '" type="' + esc(type || 'text') + '" value="' + esc(state.draft[key]) + '" min="1" /></div>';
  }
  function textarea(label, key) { return '<div class="pbv2-field pbv2-wide"><label>' + esc(label) + '</label><textarea data-field="' + esc(key) + '">' + esc(state.draft[key]) + '</textarea></div>'; }
  function select(label, key, options) {
    return '<div class="pbv2-field"><label>' + esc(label) + '</label><select data-field="' + esc(key) + '">' + options.map(function (o) {
      var val = Array.isArray(o) ? o[0] : o; var text = Array.isArray(o) ? o[1] : o;
      return '<option value="' + esc(val) + '" ' + (String(state.draft[key]) === String(val) ? 'selected' : '') + '>' + esc(text) + '</option>';
    }).join('') + '</select></div>';
  }

  function renderScope() {
    var segs = (state.catalog.companySizeSegments || []).map(function (s) { return [s.key, s.label + ' (' + s.headcountRange + ')']; });
    return '<div class="pbv2-form-grid">' +
      field('Customer / Prospect Company', 'companyName') + field('Primary Contact Name', 'contactName') +
      field('Contact Email', 'contactEmail', 'email') + field('Estimated Close Date', 'estimatedCloseDate', 'date') +
      select('Company Size Segment', 'companySegment', segs) + field('Monitored Users', 'userCount', 'number') +
      select('Sector', 'sector', [['commercial','Commercial'], ['govt-public-works','Govt / Public Works']]) + select('Contract Years', 'contractYears', [[1,'1 year'], [2,'2 years'], [3,'3 years']]) +
      field('Proposal Title', 'proposalTitle', 'text', true) + textarea('Client Challenge / Pain Points', 'notes') +
      '</div>';
  }

  function renderSolutions() {
    var html = '<div class="pbv2-options">' + SOLUTIONS.map(function (s) {
      var checked = state.draft.selectedSolutions.indexOf(s[0]) >= 0;
      var skuText = s[2] ? 'Maps to catalog SKU ' + s[2] : 'Catalog mapping pending';
      var disabled = !s[2] || !activeSku(s[2]);
      return '<label class="pbv2-option">' +
        '<input type="checkbox" data-solution="' + s[0] + '" ' + (checked ? 'checked' : '') + (disabled ? ' disabled' : '') + ' />' +
        '<span><strong>' + s[0] + ' - ' + esc(s[1]) + '</strong><p>' + esc(s[3]) + '</p><p>' + esc(skuText) + '</p></span>' +
        '</label>';
    }).join('') + '</div>';
    html += '<div class="pbv2-warning">EDLP is shown as a V2 solution area, but no active catalog SKU is currently available. It is intentionally disabled until the catalog is aligned.</div>';
    html += '<h3>Add-Ons</h3><div class="pbv2-options">' + ADDONS.map(function (a) {
      var checked = !!state.draft.addOns[a[0]];
      var disabled = a[0] === 'ultrawide' && state.draft.selectedSolutions.indexOf('SW') < 0;
      return '<label class="pbv2-option"><input type="checkbox" data-addon="' + a[0] + '" ' + (checked ? 'checked' : '') + (disabled ? ' disabled' : '') + ' /><span><strong>' + esc(a[1]) + '</strong><p>' + esc(a[3]) + '</p><p>Maps to catalog SKU ' + esc(a[2]) + '</p></span></label>';
    }).join('') + '</div>';
    html += '<h3>Regulated Requirements</h3><div class="pbv2-chip-row">' + REGULATED.map(function (r) {
      return '<label class="pbv2-chip"><input type="checkbox" data-reg="' + esc(r[0]) + '" ' + (state.draft.selectedRegulated.indexOf(r[0]) >= 0 ? 'checked' : '') + ' />' + esc(r[0]) + '</label>';
    }).join('') + '</div>';
    return html;
  }

  function renderReview() {
    var c = state.calculation || {};
    var codes = mappedSkuCodes();
    var lines = (c.lines || []).map(function (l) { return '<div class="pbv2-line"><span>' + esc(l.code + ' - ' + l.name) + '</span><strong>' + fmt(l.lineAmountUsd) + '</strong></div>'; }).join('');
    return '<h3>Mapped Catalog SKUs</h3><p class="pbv2-note">' + esc(codes.join(', ') || 'None selected') + '</p>' +
      '<h3>Priced Lines</h3>' + (lines || '<div class="pbv2-warning">Select at least one solution area to calculate priced lines. Required CORE and CARE will still be auto-included by the math engine.</div>') +
      '<h3>Notes</h3><p class="pbv2-note">Required CORE and CARE are auto-included. Conditional add-ons require their parent SKU. Bundle discounts and multi-year continuity are applied by proposal-math.js.</p>';
  }

  function renderSubmit() {
    return '<div class="pbv2-form-grid">' +
      field('Partner Email To Receive Proposal', 'partnerEmail', 'email') + field('CC To', 'ccTo', 'text') +
      '</div><div class="pbv2-actions"><button type="button" class="primary" id="pbv2-create-pdf">Create PDF, Download, and Email</button><button type="button" id="pbv2-generate-text">Generate Text Summary</button><button type="button" id="pbv2-copy-text">Copy Text Summary</button></div>' +
      '<div class="pbv2-output" id="pbv2-output"></div>';
  }

  function renderSummary() {
    var c = state.calculation;
    var lines = document.getElementById('pbv2-summary-lines');
    var total = document.getElementById('pbv2-total');
    var note = document.getElementById('pbv2-summary-note');
    if (!lines || !total || !c || c.hasErrors) {
      if (lines) lines.innerHTML = '<div class="pbv2-warning">Complete scope fields to calculate pricing.</div>';
      if (total) total.textContent = '$0';
      return;
    }
    lines.innerHTML = [
      ['Recurring List', c.totals.recurringListUsd], ['Bundle Discount', -(c.bundleDiscount.discountAmountUsd || 0)],
      ['Year 1 Recurring', c.totals.recurringYear1Usd], ['One-Time', c.totals.oneTimeUsd], ['TCV', c.totals.tcvUsd]
    ].map(function (r) { return '<div class="pbv2-line"><span>' + r[0] + '</span><strong>' + fmt(r[1]) + '</strong></div>'; }).join('');
    total.textContent = fmt(c.totals.year1AnnualUsd);
    if (note) note.textContent = 'Bundle discount: ' + c.bundleDiscount.discountPct + '%. Contract years: ' + c.totals.contractYears + '. TCV: ' + fmt(c.totals.tcvUsd) + '.';
  }

  function bind() {
    var back = document.getElementById('pbv2-back');
    var next = document.getElementById('pbv2-next');
    if (back) { back.disabled = state.step === 0; back.onclick = function () { if (state.step > 0) { state.step--; render(); } }; }
    if (next) { next.textContent = state.step === STEPS.length - 1 ? 'Done' : 'Next'; next.onclick = function () { if (state.step < STEPS.length - 1) { state.step++; render(); } }; }
    document.querySelectorAll('[data-field]').forEach(function (el) { el.oninput = el.onchange = function () { var key = el.dataset.field; state.draft[key] = (el.type === 'number') ? Math.max(1, parseInt(el.value, 10) || 1) : el.value; calc(); renderSummary(); }; });
    document.querySelectorAll('[data-solution]').forEach(function (el) { el.onchange = function () { toggle(state.draft.selectedSolutions, el.dataset.solution, el.checked); if (el.dataset.solution === 'SW') state.draft.addOns.ultrawide = el.checked; render(); }; });
    document.querySelectorAll('[data-addon]').forEach(function (el) { el.onchange = function () { state.draft.addOns[el.dataset.addon] = el.checked; render(); }; });
    document.querySelectorAll('[data-reg]').forEach(function (el) { el.onchange = function () { toggle(state.draft.selectedRegulated, el.dataset.reg, el.checked); render(); }; });
    var pdf = document.getElementById('pbv2-create-pdf'); if (pdf) pdf.onclick = createPdf;
    var text = document.getElementById('pbv2-generate-text'); if (text) text.onclick = renderOutput;
    var copy = document.getElementById('pbv2-copy-text'); if (copy) copy.onclick = copyOutput;
  }

  function rendererDraft() {
    var d = state.draft;
    return {
      companyName: d.companyName,
      contactName: d.contactName,
      contactEmail: d.contactEmail,
      primaryUseCase: d.primaryUseCase,
      dealStage: d.dealStage,
      estimatedCloseDate: d.estimatedCloseDate,
      userCount: parseInt(d.userCount, 10) || 0,
      companySegment: d.companySegment,
      sector: d.sector,
      contractYears: parseInt(d.contractYears, 10) || 1,
      proposalTitle: d.proposalTitle,
      notes: d.notes
    };
  }

  function createPdf() {
    calc();
    if (!window.TrendzactProposalRender) { alert('Proposal renderer not loaded.'); return; }
    if (!state.calculation || state.calculation.hasErrors) { alert('Complete required fields before creating the PDF.'); return; }
    var result = window.TrendzactProposalRender.render({
      draft: rendererDraft(), calculation: state.calculation, catalog: state.catalog,
      partnerEmail: state.draft.partnerEmail, ccTo: state.draft.ccTo
    });
    var out = document.getElementById('pbv2-output');
    if (out) { out.style.display = 'block'; out.textContent = 'Created PDF: ' + result.filename + '\nProposal ID: ' + result.proposalId + '\nEmail send in progress...'; }
    if (result.emailPromise) {
      result.emailPromise.then(function (email) {
        if (out) out.textContent += '\nEmail result: ' + (email.ok ? 'sent' : 'not sent - ' + (email.error || email.code));
      });
    }
  }

  function summaryText() {
    calc(); var c = state.calculation || {}; var d = state.draft;
    return 'Proposal Builder V2 Draft Summary\n' +
      'Customer: ' + (d.companyName || 'TBD') + '\n' +
      'Monitored Users: ' + d.userCount + '\n' +
      'Solutions: ' + (d.selectedSolutions.join(', ') || 'None') + '\n' +
      'Mapped SKUs: ' + (mappedSkuCodes().join(', ') || 'None') + '\n' +
      'Regulated Requirements: ' + (d.selectedRegulated.join(', ') || 'None') + '\n' +
      'Year 1 Total: ' + (c.totals ? fmt(c.totals.year1AnnualUsd) : '$0') + '\n' +
      'TCV: ' + (c.totals ? fmt(c.totals.tcvUsd) : '$0') + '\n' +
      'Note: V2 maps to catalog.json, proposal-math.js, and proposal-render.js. No separate hardware line item.';
  }
  function renderOutput() { var out = document.getElementById('pbv2-output'); if (out) { out.style.display = 'block'; out.textContent = summaryText(); } }
  async function copyOutput() { try { await navigator.clipboard.writeText(summaryText()); } catch (e) { renderOutput(); } }

  document.addEventListener('DOMContentLoaded', init);
})();
