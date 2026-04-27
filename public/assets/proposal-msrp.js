// Proposal Builder MSRP labeling overlay
// Adds prominent MSRP price language to Step 3 and patches the PDF label text
// without changing the v1 pricing math engine.
(function () {
  'use strict';

  var MSRP_LABEL = 'MSRP Price USD($)';
  var MSRP_NOTE = 'Actual price based on distributor negotiated terms';

  function installStyles() {
    if (document.getElementById('proposal-msrp-style')) return;
    var style = document.createElement('style');
    style.id = 'proposal-msrp-style';
    style.textContent = [
      '.proposal-msrp-banner{border:2px solid #00827c;background:#eefaf8;border-radius:16px;padding:16px 18px;margin:0 0 18px;box-shadow:0 8px 24px rgba(0,130,124,.10)}',
      '.proposal-msrp-banner strong{display:block;font-size:22px;line-height:1.15;color:#053f3b;margin-bottom:5px}',
      '.proposal-msrp-banner span{display:block;font-size:13px;color:#353d4a;font-weight:700}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function isReviewStep() {
    var active = document.querySelector('.tp-step-chip.active');
    if (active && /Review\s*&\s*Calculate/i.test(active.textContent || '')) return true;
    var panel = document.getElementById('tp-panel');
    return !!(panel && /Review\s*&\s*Calculate/i.test(panel.textContent || ''));
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
          .replace('INDICATIVE PRICING SUMMARY', MSRP_LABEL)
          .replace('Scope & Indicative Pricing', 'Scope & ' + MSRP_LABEL)
          .replace('Year 1 Total (recurring + one-time)', MSRP_LABEL + ' - Year 1')
          .replace('Total Contract Value', 'MSRP Total Contract Value USD($)')
          .replace('Indicative pricing is included for planning purposes.', MSRP_LABEL + ' is included for planning purposes. ' + MSRP_NOTE + '.')
          .replace('Pricing shown is indicative and based on information provided at the time of generation.', MSRP_LABEL + ' shown is based on information provided at the time of generation. ' + MSRP_NOTE + '.');
      }

      var result = originalText.call(this, value, x, y, options, transform);

      if (originalValue === 'INDICATIVE PRICING SUMMARY') {
        try {
          this.setFont('helvetica', 'bold');
          this.setFontSize(7);
          this.setTextColor(224, 244, 243);
          originalText.call(this, MSRP_NOTE, x, y + 5, options, transform);
        } catch (e) {
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
    var obs = new MutationObserver(function () {
      enhanceReviewStep();
      patchPdfText();
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
