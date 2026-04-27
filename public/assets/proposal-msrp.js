// Proposal Builder MSRP labeling overlay
// Adds prominent MSRP price language to Step 3/4 and patches the PDF label text
// without changing the v1 pricing math engine.
(function () {
  'use strict';

  var MSRP_LABEL = 'MSRP Price USD($)';
  var MSRP_SUMMARY_LABEL = 'MSRP PRICING SUMMARY USD($)';
  var MSRP_TCV_LABEL = 'Total contract value based on MSRP Pricing US$.';
  var MSRP_NOTE = 'Actual price based on distributor negotiated terms';

  function installStyles() {
    if (document.getElementById('proposal-msrp-style')) return;
    var style = document.createElement('style');
    style.id = 'proposal-msrp-style';
    style.textContent = [
      '.proposal-msrp-banner{border:2px solid #00827c;background:#eefaf8;border-radius:16px;padding:16px 18px;margin:0 0 18px;box-shadow:0 8px 24px rgba(0,130,124,.10)}',
      '.proposal-msrp-banner strong{display:block;font-size:22px;line-height:1.15;color:#053f3b;margin-bottom:5px}',
      '.proposal-msrp-banner span{display:block;font-size:13px;color:#353d4a;font-weight:700}',
      '.proposal-msrp-subline{display:block;font-size:12px;line-height:1.35;color:#353d4a;font-weight:700;margin-top:3px}',
      '.proposal-msrp-tcv{font-weight:800;color:#053f3b}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function getActiveStepText() {
    var active = document.querySelector('.tp-step-chip.active');
    return active ? (active.textContent || '') : '';
  }

  function isReviewStep() {
    var activeText = getActiveStepText();
    if (/Review\s*&\s*Calculate/i.test(activeText)) return true;
    var panel = document.getElementById('tp-panel');
    return !!(panel && /Review\s*&\s*Calculate/i.test(panel.textContent || ''));
  }

  function isSubmitStep() {
    var activeText = getActiveStepText();
    if (/Save\s*&\s*Submit/i.test(activeText)) return true;
    var panel = document.getElementById('tp-panel');
    return !!(panel && /Save\s*&\s*Submit|Submit/i.test(panel.textContent || ''));
  }

  function enhanceReviewStep() {
    var panel = document.getElementById('tp-panel');
    if (!panel || !isReviewStep()) return;
    if (panel.querySelector('.proposal-msrp-banner')) return;
    var banner = document.createElement('div');
    banner.className = 'proposal-msrp-banner';
    banner.innerHTML = '<strong>' + MSRP_LABEL + '</strong><span>' + MSRP_NOTE + '</span>';
    panel.insertBefore(banner, panel.firstChild);
  }

  function rewriteTextNodes(root) {
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var node;
    while ((node = walker.nextNode())) {
      var text = node.nodeValue || '';
      var next = text
        .replace(/Total Contract Value/g, MSRP_TCV_LABEL)
        .replace(/MSRP Total Contract Value USD\(\$\)/g, MSRP_TCV_LABEL)
        .replace(/TCV \(/g, 'MSRP TCV (')
        .replace(/TCV:/g, 'MSRP TCV:');
      if (next !== text) node.nodeValue = next;
    }
  }

  function addTcvSubline(root) {
    if (!root) return;
    var candidates = root.querySelectorAll('div, p, span, td, th, li');
    candidates.forEach(function (el) {
      var text = (el.textContent || '').trim();
      if (!/Total contract value based on MSRP Pricing US\$\.|MSRP TCV/i.test(text)) return;
      if (el.querySelector && el.querySelector('.proposal-msrp-subline')) return;
      if (el.closest && el.closest('.proposal-msrp-subline')) return;
      var line = document.createElement('span');
      line.className = 'proposal-msrp-subline';
      line.textContent = MSRP_NOTE;
      el.appendChild(line);
      el.classList.add('proposal-msrp-tcv');
    });
  }

  function enhanceStep3And4Labels() {
    var panel = document.getElementById('tp-panel');
    if (!panel) return;
    if (!isReviewStep() && !isSubmitStep()) return;
    rewriteTextNodes(panel);
    addTcvSubline(panel);
  }

  function patchPdfText() {
    var jspdf = window.jspdf && window.jspdf.jsPDF;
    if (!jspdf || !jspdf.API || jspdf.API.__proposalMsrpPatched) return false;
    var originalText = jspdf.API.text;
    if (typeof originalText !== 'function') return false;

    jspdf.API.__proposalMsrpPatched = true;
    jspdf.API.text = function (value, x, y, options, transform) {
      var originalValue = value;
      if (typeof value === 'string') {
        value = value
          .replace('INDICATIVE PRICING SUMMARY', MSRP_SUMMARY_LABEL)
          .replace('Scope & Indicative Pricing', 'Scope & MSRP Pricing USD($)')
          .replace('Year 1 Total (recurring + one-time)', MSRP_LABEL + ' - Year 1')
          .replace('Total Contract Value', MSRP_TCV_LABEL)
          .replace('MSRP Total Contract Value USD($)', MSRP_TCV_LABEL)
          .replace('Indicative pricing is included for planning purposes.', MSRP_LABEL + ' is included for planning purposes. ' + MSRP_NOTE + '.')
          .replace('Pricing shown is indicative and based on information provided at the time of generation.', MSRP_LABEL + ' shown is based on information provided at the time of generation. ' + MSRP_NOTE + '.');
      }

      var result = originalText.call(this, value, x, y, options, transform);

      if (originalValue === 'INDICATIVE PRICING SUMMARY' || originalValue === MSRP_SUMMARY_LABEL) {
        try {
          this.setFont('helvetica', 'bold');
          this.setFontSize(7);
          this.setTextColor(224, 244, 243);
          originalText.call(this, MSRP_NOTE, x, y + 5, options, transform);
        } catch (e) {
          // Non-critical visual enhancement only.
        }
      }
      if (typeof originalValue === 'string' && /Total Contract Value|MSRP Total Contract Value/.test(originalValue)) {
        try {
          this.setFont('helvetica', 'bold');
          this.setFontSize(7);
          this.setTextColor(122, 127, 136);
          originalText.call(this, MSRP_NOTE, x, y + 4, options, transform);
        } catch (e2) {
          // Non-critical visual enhancement only.
        }
      }
      return result;
    };
    return true;
  }

  function boot() {
    installStyles();
    patchPdfText();
    enhanceReviewStep();
    enhanceStep3And4Labels();
    var obs = new MutationObserver(function () {
      enhanceReviewStep();
      enhanceStep3And4Labels();
      patchPdfText();
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
