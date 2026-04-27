// Trendzact Proposal Builder V2 - Phase 1 hidden URL build
(function () {
  'use strict';

  var PRICES = {
    platformBaseAnnual: 12000,
    moduleAnnualPerUser: { SW: 18, IRA: 14, SVM: 16, ITM: 22, EDLP: 20 },
    addonAnnualPerUser: { ultrawide: 8, privacyScreen: 6 },
    implementation: { Basic: 7500, Standard: 15000, Complex: 30000 },
    managedServicesAnnual: { None: 0, Standard: 18000, ManagedSOC: 42000 },
    retentionAnnual: { Standard: 0, Extended: 9000, Custom: 18000 },
    tierMultiplier: { Core: 1, Advanced: 1.35, Regulated: 1.7 },
    termDiscount: { Monthly: 0, Annual: 0.05, ThreeYear: 0.10 }
  };

  var SOLUTIONS = [
    ['SW', 'Secure Workspace'],
    ['IRA', 'Identity Recognition Assurance'],
    ['SVM', 'Secure Virtual Meeting'],
    ['ITM', 'Insider Threat Management'],
    ['EDLP', 'Exposure Data Loss Prevention']
  ];

  var state = {
    customerName: '', industry: '', region: 'US', monitoredUsers: 100, monitoredEndpoints: 100,
    term: 'Annual', deployment: 'SaaS', tier: 'Core', implementation: 'Standard',
    managedServices: 'None', retention: 'Standard', selectedSolutions: [], selectedRegulated: [],
    regulatedDeployment: false, ultrawide: false, privacyScreen: false
  };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function money(n) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.round(n || 0)); }
  function toggle(arr, val, yes) { var i = arr.indexOf(val); if (yes && i < 0) arr.push(val); if (!yes && i >= 0) arr.splice(i, 1); }
  function labelFor(code) { var x = SOLUTIONS.find(function (s) { return s[0] === code; }); return x ? x[1] : code; }

  function field(label, key, type) {
    return '<div class="pbv2-field"><label>' + esc(label) + '</label><input data-field="' + esc(key) + '" type="' + esc(type || 'text') + '" value="' + esc(state[key]) + '" min="0" /></div>';
  }
  function select(label, key, options) {
    return '<div class="pbv2-field"><label>' + esc(label) + '</label><select data-field="' + esc(key) + '">' + options.map(function (o) { return '<option value="' + esc(o) + '" ' + (state[key] === o ? 'selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select></div>';
  }
  function section(title, body) { return '<div class="pbv2-section"><div class="pbv2-section-title"><h3>' + esc(title) + '</h3></div>' + body + '</div>'; }

  function render() {
    var mount = document.getElementById('pbv2-form');
    if (!mount) return;
    mount.innerHTML =
      section('Step 1 - Customer Scope', '<div class="pbv2-form-grid">' +
        field('Customer Name', 'customerName') + field('Industry', 'industry') + select('Primary Region', 'region', ['US','EU','UK','Canada','APAC','Other']) +
        field('Number of Monitored Users', 'monitoredUsers', 'number') + field('Number of Monitored Endpoints', 'monitoredEndpoints', 'number') +
        select('Contract Term', 'term', ['Monthly','Annual','ThreeYear']) + select('Deployment Type', 'deployment', ['SaaS','Private VPC','Hybrid']) + '</div>') +
      section('Step 2 - Solution Area Selector', '<div class="pbv2-options">' + SOLUTIONS.map(function (s) { return '<label class="pbv2-option"><input type="checkbox" data-solution="' + s[0] + '" ' + (state.selectedSolutions.indexOf(s[0]) >= 0 ? 'checked' : '') + '><span><strong>' + s[0] + ' - ' + esc(s[1]) + '</strong><p>Priced per monitored user.</p></span></label>'; }).join('') + '</div>') +
      section('Step 3 - Package Tier', '<div class="pbv2-chip-row">' + ['Core','Advanced','Regulated'].map(function (t) { return '<label class="pbv2-chip"><input type="radio" name="tier" value="' + t + '" ' + (state.tier === t ? 'checked' : '') + '>' + t + '</label>'; }).join('') + '</div>') +
      section('Step 4 - Regulated Requirements', '<div class="pbv2-chip-row">' + ['Government / Public Sector','EU Territory / GDPR','Works Council','PCI DSS','HIPAA','Data Residency','Evidence Retention','DPIA / Privacy Review'].map(function (r) { return '<label class="pbv2-chip"><input type="checkbox" data-reg="' + esc(r) + '" ' + (state.selectedRegulated.indexOf(r) >= 0 ? 'checked' : '') + '>' + esc(r) + '</label>'; }).join('') + '</div>') +
      section('Step 5 - Add-On Selector', '<div class="pbv2-options"><label class="pbv2-option"><input type="checkbox" data-bool="ultrawide" ' + (state.ultrawide ? 'checked' : '') + '><span><strong>Trendzact Ultrawide Webcam</strong><p>Applies to Secure Workspace only. Per monitored user service add-on.</p></span></label><label class="pbv2-option"><input type="checkbox" data-bool="privacyScreen" ' + (state.privacyScreen ? 'checked' : '') + '><span><strong>Privacy Screen</strong><p>Per monitored user service add-on.</p></span></label></div>') +
      section('Step 6 - Delivery Assumptions', '<div class="pbv2-form-grid">' + select('Implementation Complexity', 'implementation', ['Basic','Standard','Complex']) + select('Managed Services', 'managedServices', ['None','Standard','ManagedSOC']) + select('Evidence Retention', 'retention', ['Standard','Extended','Custom']) + '</div>');
    bind(); calcRender();
  }

  function bind() {
    document.querySelectorAll('[data-field]').forEach(function (el) { el.oninput = el.onchange = function () { state[el.dataset.field] = (el.type === 'number') ? Math.max(0, parseInt(el.value, 10) || 0) : el.value; calcRender(); }; });
    document.querySelectorAll('[data-solution]').forEach(function (el) { el.onchange = function () { toggle(state.selectedSolutions, el.dataset.solution, el.checked); if (el.dataset.solution === 'SW') state.ultrawide = el.checked; render(); }; });
    document.querySelectorAll('[name="tier"]').forEach(function (el) { el.onchange = function () { state.tier = el.value; if (el.value === 'Regulated') state.privacyScreen = true; render(); }; });
    document.querySelectorAll('[data-reg]').forEach(function (el) { el.onchange = function () { toggle(state.selectedRegulated, el.dataset.reg, el.checked); if (state.selectedRegulated.length) { state.tier = 'Regulated'; state.regulatedDeployment = true; } render(); }; });
    document.querySelectorAll('[data-bool]').forEach(function (el) { el.onchange = function () { state[el.dataset.bool] = el.checked; calcRender(); }; });
    document.getElementById('pbv2-generate').onclick = renderOutput;
    document.getElementById('pbv2-copy').onclick = copyOutput;
  }

  function calculate() {
    var users = Math.max(0, parseInt(state.monitoredUsers, 10) || 0);
    var modules = state.selectedSolutions.reduce(function (sum, code) { return sum + ((PRICES.moduleAnnualPerUser[code] || 0) * users); }, 0) * PRICES.tierMultiplier[state.tier];
    var addons = 0;
    if (state.ultrawide && state.selectedSolutions.indexOf('SW') >= 0) addons += PRICES.addonAnnualPerUser.ultrawide * users;
    if (state.privacyScreen) addons += PRICES.addonAnnualPerUser.privacyScreen * users;
    var implementation = PRICES.implementation[state.implementation] || 0;
    var managed = PRICES.managedServicesAnnual[state.managedServices] || 0;
    var retention = PRICES.retentionAnnual[state.retention] || 0;
    var subtotal = PRICES.platformBaseAnnual + modules + addons + implementation + managed + retention;
    var discount = subtotal * PRICES.termDiscount[state.term];
    return { platform: PRICES.platformBaseAnnual, modules: modules, addons: addons, implementation: implementation, managed: managed, retention: retention, discount: discount, total: subtotal - discount };
  }

  function calcRender() {
    var c = calculate();
    var rows = [['Platform Base', c.platform], ['Selected Solution Modules', c.modules], ['Per-User Add-Ons', c.addons], ['Implementation', c.implementation], ['Managed Services', c.managed], ['Storage / Retention', c.retention], ['Term Discount', -c.discount]];
    var lines = document.getElementById('pbv2-summary-lines');
    if (lines) lines.innerHTML = rows.map(function (r) { return '<div class="pbv2-line"><span>' + r[0] + '</span><strong>' + money(r[1]) + '</strong></div>'; }).join('');
    var total = document.getElementById('pbv2-total');
    if (total) total.textContent = money(c.total);
  }

  function summaryText() {
    var c = calculate();
    return 'Proposal Builder V2 Draft Summary\n' +
      'Customer: ' + (state.customerName || 'TBD') + '\n' +
      'Monitored Users: ' + state.monitoredUsers + '\n' +
      'Package Tier: ' + state.tier + '\n' +
      'Solutions: ' + (state.selectedSolutions.map(function (s) { return s + ' - ' + labelFor(s); }).join(', ') || 'None') + '\n' +
      'Regulated Requirements: ' + (state.selectedRegulated.join(', ') || 'None') + '\n' +
      'Add-Ons: ' + [state.ultrawide ? 'Trendzact Ultrawide Webcam' : '', state.privacyScreen ? 'Privacy Screen' : ''].filter(Boolean).join(', ') + '\n' +
      'Estimated Annual Recurring: ' + money(c.total) + '\n' +
      'Note: No separate hardware line item; add-ons are enablement/service SKUs.';
  }
  function renderOutput() { var el = document.getElementById('pbv2-output'); el.textContent = summaryText(); el.style.display = 'block'; }
  async function copyOutput() { try { await navigator.clipboard.writeText(summaryText()); } catch (e) { renderOutput(); } }
  document.addEventListener('DOMContentLoaded', render);
})();
