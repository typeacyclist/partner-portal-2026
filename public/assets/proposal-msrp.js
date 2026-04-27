// Proposal Builder MSRP labeling overlay
// Adds MSRP price language inside Step 3/4 pricing sections and patches PDF labels
// without changing the v1 pricing math engine.
(function () {
  'use strict';

  var MSRP_LABEL = 'MSRP Price USD($)';
  var MSRP_SUMMARY_LABEL = 'MSRP PRICING SUMMARY USD($)';
  var MSRP_NOTE = 'Actual price based on distributor negotiated terms';

  function installStyles() {
    if (document.getElementById('proposal-msrp-style')) return;
    var style = document.createElement('style');
    style.id = 'proposal-msrp-style';
    style.textContent = [
      '.proposal-msrp-inline{border:1px solid #00827c;background:#eefaf8;border-radius:12px;padding:10px 12px;margin:8px 0 12px;box-shadow:0 4px 14px rgba(0,130,124,.08)}',
      '.proposal-msrp-inline strong{display:block;font-size:15px;line-height:1.2;color:#053f3b;margin-bottom:3px}',
      '.proposal-msrp-inline span{display:block;font-size:12px;color:#353d4a;font-weight:700}'
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

  function makeInlineBlock(id) {
    var block = document.createElement('div');
    block.className = 'proposal-msrp-inline';
    block.setAttribute('data-msrp-slot', id);
    block.innerHTML = '<strong>' + MSRP_LABEL + '</strong><span>' + MSRP_NOTE + '</span>';
    return block;
  }

  function findTextParent(root, pattern) {
    if (!root) return null;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var node;
    while ((node = walker.nextNode())) {
      if (pattern.test(node.nodeValue || '')) return node.parentElement;
    }
    return null;
  }

  function insertAfter(target, node) {
    if (!target || !target.parentNode || !node) return;
    target.parentNode.insertBefore(node, target.nextSibling);
  }

  function addMsrpInsideStep3() {
    var panel = document.getElementById('tp-panel');
    if (!panel || !isReviewStep()) return;
    if (panel.querySelector('[data-msrp-slot="step3-recurring"]')) return;

    var target = findTextParent(panel, /Recurring subtotal \(list\)|Annual recurring by year/i);
    if (!target) return;
    insertAfter(target, makeInlineBlock('step3-recurring'));
  }

  function addMsrpInsideStep4() {
    var panel = document.getElementById('tp-panel');
    if (!panel || !isSubmitStep()) return;
    if (panel.querySelector('[data-msrp-slot="step4-tcv"]')) return;

    var target = findTextParent(panel, /Total contract value|Total Contract Value|TCV/i);
    if (!target) return;
    insertAfter(target, makeInlineBlock('step4-tcv'));
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
          .replace('Year 1 Total (recurring + one-time)', 'Year 1 MSRP Price USD($)')
          .replace('Pricing shown is indicative and based on information provided at the time of generation.', MSRP_LABEL + ' shown is based on information provided at the time of generation. ' + MSRP_NOTE + '.')
          .replace('Indicative pricing is included for planning purposes.', MSRP_LABEL + ' is included for planning purposes. ' + MSRP_NOTE + '.');
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

      if (typeof originalValue === 'string' && /Total Contract Value|Total contract value|TCV/.test(originalValue)) {
        try {
          this.setFont('helvetica', 'bold');
          this.setFontSize(7);
          this.setTextColor(122, 127, 136);
          originalText.call(this, MSRP_LABEL, x, y + 4, options, transform);
          originalText.call(this, MSRP_NOTE, x, y + 8, options, transform);
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
    addMsrpInsideStep3();
    addMsrpInsideStep4();
    var obs = new MutationObserver(function () {
      addMsrpInsideStep3();
      addMsrpInsideStep4();
      patchPdfText();
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
