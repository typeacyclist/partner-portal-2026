// Trendzact Partners - Proposal PDF Renderer (v7)
//
// Takes a draft + allTiers (3 commitment options) + catalog and produces a 3-page PDF using jsPDF.
// v7 changes:
//   - Module-count pricing with commitment tiers
//   - All 3 commitment options (1yr / 2yr / 3yr) shown on cover page
//   - Line items on page 2 use 1-year base rates
//   - No bundle discount references
//   - Uses v7 result field names (annualRecurringMsrp, tcvMsrp, msrpLine, etc.)
//
// Public API:
//   window.TrendzactProposalRender.render({ draft, allTiers, catalog, partnerEmail, ccTo })
//     -> { proposalId, filename, emailPromise } and triggers browser download.

(function () {
  'use strict';

  var C = {
    darkGray:  [53, 61, 74],
    medGray:   [122, 127, 136],
    darkGreen: [0, 130, 124],
    medGreen:  [0, 163, 152],
    tintDark:  [224, 244, 243],
    tintLight: [240, 250, 249],
    border:    [229, 231, 235],
    white:     [255, 255, 255]
  };

  var PAGE_W = 210, PAGE_H = 297, MARGIN = 16;
  var CONTENT_W = PAGE_W - MARGIN * 2;
  var MSRP_LABEL = 'MSRP Price USD($)';
  var MSRP_SUMMARY_LABEL = 'MSRP PRICING SUMMARY USD($)';
  var MSRP_NOTE = 'Actual price based on distributor negotiated terms';

  function fmt(n) {
    if (n == null || isNaN(n)) return '$0';
    return '$' + Math.round(n).toLocaleString('en-US');
  }

  function fillRect(doc, x, y, w, h, color) {
    doc.setFillColor.apply(doc, color);
    doc.rect(x, y, w, h, 'F');
  }

  function text(doc, str, x, y, opts) {
    opts = opts || {};
    doc.setFont(opts.font || 'helvetica', opts.style || 'normal');
    doc.setFontSize(opts.size || 10);
    var color = opts.color || C.darkGray;
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(str || '', x, y, opts.align ? { align: opts.align } : undefined);
  }

  function lines(doc, str, x, y, width, opts) {
    opts = opts || {};
    doc.setFont(opts.font || 'helvetica', opts.style || 'normal');
    doc.setFontSize(opts.size || 10);
    var color = opts.color || C.darkGray;
    doc.setTextColor(color[0], color[1], color[2]);
    var wrapped = doc.splitTextToSize(str || '', width);
    doc.text(wrapped, x, y);
    return wrapped.length;
  }

  function formatSectorLabel(sector) {
    if (!sector) return '—';
    if (sector === 'commercial') return 'Commercial';
    if (sector === 'govt-public-works') return 'Govt / Public Works';
    return String(sector).split('-').map(function (part) {
      return part ? part.charAt(0).toUpperCase() + part.slice(1) : part;
    }).join(' ');
  }

  function pageFooter(doc, pageNum, totalPages, proposalId, portalDomain) {
    var domainLabel = portalDomain || 'partner portal';
    text(doc, 'Trendzact Partner Proposal ' + proposalId + ' - Confidential. For ' + domainLabel + ' use only.', MARGIN, PAGE_H - 8, { size: 8, color: C.medGray });
    text(doc, 'Page ' + pageNum + ' of ' + totalPages, PAGE_W - MARGIN, PAGE_H - 8, { size: 8, color: C.medGray, align: 'right' });
  }

  function buildPdf(input) {
    var draft = input.draft || {};
    var allTiers = input.allTiers || [];
    var calc = allTiers[0] || input.calculation || {};
    var partnerEmail = input.partnerEmail || '';
    var jspdf = window.jspdf;
    if (!jspdf || !jspdf.jsPDF) throw new Error('jsPDF library not loaded');

    var doc = new jspdf.jsPDF({ unit: 'mm', format: 'a4' });
    var proposalId = calc.proposalId;
    var generatedAt = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    var totalPages = 3;
    var portalDomain = (window.location && window.location.hostname) || 'partner portal';

    // ============== PAGE 1 - COVER ==============
    fillRect(doc, 0, 0, PAGE_W, 52, C.darkGray);
    fillRect(doc, 0, 52, PAGE_W, 2, C.darkGreen);

    fillRect(doc, MARGIN, 16, 10, 10, C.darkGreen);
    doc.setDrawColor(C.white[0], C.white[1], C.white[2]);
    doc.setLineWidth(0.6);
    doc.line(MARGIN + 2, 19, MARGIN + 8, 19);
    doc.line(MARGIN + 5, 19, MARGIN + 5, 25);
    text(doc, 'Trendzact', MARGIN + 14, 21, { size: 14, style: 'bold', color: C.white });
    text(doc, 'PARTNERS', MARGIN + 14, 25.5, { size: 7, color: [180, 220, 218] });
    text(doc, 'PROPOSAL', PAGE_W - MARGIN, 21, { size: 10, style: 'bold', color: C.white, align: 'right' });
    text(doc, proposalId, PAGE_W - MARGIN, 25.5, { size: 8, color: [180, 220, 218], align: 'right' });

    // ============== PAGE 1 — COVER DETAILS ==============

    // Company name — hero
    text(doc, draft.companyName || 'Prospect', MARGIN, 76, { size: 26, style: 'bold', color: C.darkGray });

    // Subtitle: project name
    var projectName = draft.proposalTitle && draft.proposalTitle.trim() ? draft.proposalTitle.trim() : '';
    if (projectName) {
      text(doc, projectName, MARGIN, 85, { size: 12, color: C.medGray });
    }

    // Divider
    doc.setDrawColor(C.medGreen[0], C.medGreen[1], C.medGreen[2]);
    doc.setLineWidth(0.6);
    doc.line(MARGIN, 91, MARGIN + 40, 91);

    // Detail grid — 2 columns, 3 rows
    var detailY = 99;
    var detailColW = CONTENT_W / 2;
    var detailRowH = 14;
    var detailItems = [
      ['PREPARED FOR',     draft.contactName || '—'],
      ['CONTACT EMAIL',    draft.contactEmail || '—'],
      ['PRIMARY USE CASE', draft.primaryUseCase || '—'],
      ['LICENSED USERS',   (draft.userCount || 0).toLocaleString('en-US')],
      ['DEAL STAGE',       draft.dealStage || '—'],
      ['EST. DECISION',    draft.estimatedCloseDate || '—']
    ];
    detailItems.forEach(function (row, i) {
      var col = i % 2;
      var r = Math.floor(i / 2);
      var dx = MARGIN + col * detailColW;
      var dy = detailY + r * detailRowH;
      text(doc, row[0], dx, dy, { size: 7, color: C.medGray });
      text(doc, String(row[1]), dx, dy + 5, { size: 10, style: 'bold', color: C.darkGray });
    });

    // Scope note
    var noteY = detailY + 3 * detailRowH + 6;
    var scopeNote = 'This proposal outlines a Trendzact GRC One deployment scoped to ' + (draft.companyName || 'the prospect') +
        "'s priority use case and risk profile. MSRP pricing (USD) is included for planning purposes; " +
        'actual price is based on distributor negotiated terms. Final pricing, scope, and deployment terms are subject to Trendzact Deal Desk approval.';
    lines(doc, scopeNote, MARGIN, noteY, CONTENT_W, { size: 9, color: C.medGray });

    // ---- Commitment Options — 3-column comparison ----
    var boxY = 180;
    var boxH = 72;
    var colCount = allTiers.length || 1;
    var colW = CONTENT_W / colCount;
    var labelColor = [200, 200, 210];
    var valueColor = C.white;
    var highlightCol = [0, 180, 170]; // teal accent for best-value column

    text(doc, 'COMMITMENT OPTIONS', MARGIN, boxY - 4, { size: 8, style: 'bold', color: C.darkGreen });

    fillRect(doc, MARGIN, boxY, CONTENT_W, boxH, C.darkGray);
    text(doc, MSRP_SUMMARY_LABEL, MARGIN + 6, boxY + 8, { size: 7, style: 'bold', color: labelColor });
    text(doc, MSRP_NOTE, MARGIN + 6, boxY + 12.5, { size: 6.5, color: C.tintDark });

    var tierTopY = boxY + 20;
    allTiers.forEach(function (t, idx) {
      var tt = t.totals || {};
      var cx = MARGIN + idx * colW;
      var midX = cx + colW / 2;
      var isLast = idx === colCount - 1;

      // Column divider (skip first)
      if (idx > 0) {
        doc.setDrawColor(80, 85, 95);
        doc.setLineWidth(0.3);
        doc.line(cx, tierTopY - 2, cx, boxY + boxH - 5);
      }

      // Tier label
      text(doc, (t.commitment && t.commitment.label) || (tt.contractYears + '-year'), midX, tierTopY + 2, { size: 9, style: 'bold', color: isLast ? highlightCol : valueColor, align: 'center' });

      // Annual recurring
      text(doc, 'Annual recurring', midX, tierTopY + 11, { size: 7, color: labelColor, align: 'center' });
      text(doc, fmt(tt.annualRecurringMsrp), midX, tierTopY + 17, { size: 11, style: 'bold', color: valueColor, align: 'center' });

      // One-time
      text(doc, 'One-time setup', midX, tierTopY + 25, { size: 7, color: labelColor, align: 'center' });
      text(doc, fmt(tt.oneTimeMsrp), midX, tierTopY + 31, { size: 9, style: 'bold', color: valueColor, align: 'center' });

      // TCV highlight
      text(doc, 'TCV (' + tt.contractYears + 'yr)', midX, tierTopY + 39, { size: 7, color: isLast ? highlightCol : labelColor, align: 'center' });
      text(doc, fmt(tt.tcvMsrp), midX, tierTopY + 45, { size: 13, style: 'bold', color: isLast ? highlightCol : C.tintDark, align: 'center' });
    });

    text(doc, 'Generated ' + generatedAt, MARGIN, 267, { size: 8, color: C.medGray });
    if (partnerEmail) text(doc, 'Prepared by ' + partnerEmail, PAGE_W - MARGIN, 267, { size: 8, color: C.medGray, align: 'right' });
    pageFooter(doc, 1, totalPages, proposalId, portalDomain);

    // ============== PAGE 2 - LINE ITEMS ==============
    doc.addPage();
    fillRect(doc, 0, 0, PAGE_W, 14, C.tintLight);
    text(doc, 'Scope & MSRP Pricing USD($)', MARGIN, 9.5, { size: 11, style: 'bold', color: C.darkGray });
    text(doc, proposalId, PAGE_W - MARGIN, 9.5, { size: 8, color: C.medGray, align: 'right' });

    var y = 28;
    text(doc, 'PACKAGING', MARGIN, y, { size: 8, color: C.medGreen });
    fillRect(doc, MARGIN, y + 2, 30, 0.8, C.medGreen);
    y += 12;
    text(doc, 'Line items for ' + (draft.companyName || 'the prospect'), MARGIN, y, { size: 14, style: 'bold', color: C.darkGray });
    y += 8;
    text(doc, MSRP_LABEL + ' — ' + MSRP_NOTE, MARGIN, y, { size: 8, style: 'bold', color: C.medGray });
    y += 7;

    var ctx = formatSectorLabel(draft.sector) + '  |  ' + ((calc.input && calc.input.companySegmentLabel) || '—') +
        '  |  ' + ((calc.input && calc.input.moduleCount) || 0) + ' modules × ' +
        ((calc.input && calc.input.moduleMultiplier) || 0).toFixed(2) +
        '  |  1-year base rates (see cover for commitment options)';
    text(doc, ctx, MARGIN, y, { size: 9, color: C.medGray });
    y += 10;

    var cols = [
      { label: 'SKU', x: MARGIN + 3, w: 28, align: 'left' },
      { label: 'Description', x: MARGIN + 31, w: 100, align: 'left' },
      { label: 'MSRP', x: PAGE_W - MARGIN - 5, w: 30, align: 'right' }
    ];
    var tableLeft = MARGIN, tableRight = PAGE_W - MARGIN, tableWidth = tableRight - tableLeft;
    var headerH = 9, rowH = 8;

    fillRect(doc, tableLeft, y, tableWidth, headerH, C.tintLight);
    doc.setDrawColor(C.border[0], C.border[1], C.border[2]);
    doc.setLineWidth(0.2);
    doc.line(tableLeft, y + headerH, tableRight, y + headerH);
    cols.forEach(function (col) {
      text(doc, col.label, col.x, y + 6, { size: 8, style: 'bold', color: C.darkGray, align: col.align });
    });
    y += headerH;

    var pageBreakAt = PAGE_H - 50;
    (calc.lines || []).forEach(function (l, i) {
      if (y > pageBreakAt) {
        pageFooter(doc, doc.internal.getNumberOfPages(), totalPages, proposalId, portalDomain);
        doc.addPage();
        fillRect(doc, 0, 0, PAGE_W, 14, C.tintLight);
        text(doc, 'Scope & MSRP Pricing USD($) (continued)', MARGIN, 9.5, { size: 11, style: 'bold', color: C.darkGray });
        y = 28;
        fillRect(doc, tableLeft, y, tableWidth, headerH, C.tintLight);
        doc.line(tableLeft, y + headerH, tableRight, y + headerH);
        cols.forEach(function (col) {
          text(doc, col.label, col.x, y + 6, { size: 8, style: 'bold', color: C.darkGray, align: col.align });
        });
        y += headerH;
      }

      if (i % 2 === 1) fillRect(doc, tableLeft, y, tableWidth, rowH, [250, 250, 251]);
      var name = l.name + (l.timing === 'oneTime' ? ' (one-time)' : '');
      if (name.length > 80) name = name.slice(0, 79) + '…';
      text(doc, l.code, MARGIN + 3, y + 5.5, { size: 8.5, color: C.darkGray });
      text(doc, name, MARGIN + 31, y + 5.5, { size: 8.5, color: C.darkGray });
      text(doc, fmt(l.msrpLine), PAGE_W - MARGIN - 5, y + 5.5, { size: 8.5, color: C.darkGray, align: 'right' });
      doc.setDrawColor(C.border[0], C.border[1], C.border[2]);
      doc.line(tableLeft, y + rowH, tableRight, y + rowH);
      y += rowH;
    });

    y += 4;
    var issuedAt = new Date();
    var expiresAt = new Date(issuedAt.getTime());
    expiresAt.setUTCDate(expiresAt.getUTCDate() + 90);
    var issuedStr = issuedAt.toISOString().slice(0, 10);
    var expiresStr = expiresAt.toISOString().slice(0, 10);
    text(doc, 'MSRP pricing valid for 90 days from issue. Issued ' + issuedStr + '  ·  Expires ' + expiresStr + '. ' + MSRP_NOTE + '.', MARGIN, y + 3, { size: 8, style: 'italic', color: C.medGray });
    y += 8;

    if (draft.notes && draft.notes.trim()) {
      y += 4;
      text(doc, 'PROPOSAL NOTES', MARGIN, y, { size: 8, color: C.medGreen });
      y += 6;
      var noteCount = lines(doc, draft.notes, MARGIN, y, CONTENT_W, { size: 9, color: C.darkGray });
      y += noteCount * 4.5 + 4;
    }
    pageFooter(doc, doc.internal.getNumberOfPages(), totalPages, proposalId, portalDomain);

    // ============== PAGE 3 - NEXT STEPS ==============
    doc.addPage();
    fillRect(doc, 0, 0, PAGE_W, 14, C.tintLight);
    text(doc, 'Next Steps', MARGIN, 9.5, { size: 11, style: 'bold', color: C.darkGray });
    text(doc, proposalId, PAGE_W - MARGIN, 9.5, { size: 8, color: C.medGray, align: 'right' });

    y = 28;
    text(doc, 'NEXT STEP', MARGIN, y, { size: 8, color: C.darkGreen, style: 'bold' });
    y += 10;
    text(doc, 'How we move forward', MARGIN, y, { size: 18, style: 'bold', color: C.darkGray });
    y += 14;

    var steps = [
      ['01', 'Technical evaluation', 'SE-led session mapping the selected modules to your highest-priority risk scenarios. Demo delivered in your environment or via Trendzact tenant.'],
      ['02', 'Business case alignment', 'Workshop on audit readiness, incident reduction, and operating cost impact. Aligns scope to your budget and timing.'],
      ['03', 'Deal desk approval', 'Trendzact Deal Desk reviews final pricing, deployment terms, distributor terms, and packaging. Target turnaround: 2 business days.'],
      ['04', 'Order & provisioning', 'Sales order submitted by partner. Tenant provisioned and kickoff scheduled with Customer Success.']
    ];

    steps.forEach(function (s) {
      fillRect(doc, MARGIN, y - 4, 10, 10, C.darkGreen);
      text(doc, s[0], MARGIN + 5, y + 2.5, { size: 9, style: 'bold', color: C.white, align: 'center' });
      text(doc, s[1], MARGIN + 14, y, { size: 11, style: 'bold', color: C.darkGray });
      var bLineCount = lines(doc, s[2], MARGIN + 14, y + 5, CONTENT_W - 16, { size: 9, color: C.medGray });
      y += 8 + bLineCount * 4.5 + 6;
    });

    y += 4;
    fillRect(doc, MARGIN, y, CONTENT_W, 34, C.tintLight);
    text(doc, 'Disclaimer', MARGIN + 5, y + 8, { size: 9, style: 'bold', color: C.darkGray });
    var disc = MSRP_LABEL + ' shown is based on information provided at the time of generation. ' + MSRP_NOTE + '. ' +
        'Final pricing is subject to Trendzact Deal Desk review, volume tier approval, deployment scope, and executed reseller terms. ' +
        'This document is confidential and intended only for the named partner and prospect.';
    lines(doc, disc, MARGIN + 5, y + 14, CONTENT_W - 10, { size: 8, color: C.medGray });
    y += 40;

    fillRect(doc, MARGIN, y, CONTENT_W, 38, C.darkGray);
    text(doc, 'Questions?', MARGIN + 8, y + 12, { size: 13, style: 'bold', color: C.white });
    text(doc, 'Partner Deal Desk', MARGIN + 8, y + 20, { size: 9, color: [180, 220, 218] });
    text(doc, 'deal-desk@trendzact.com', MARGIN + 8, y + 26, { size: 11, style: 'bold', color: C.white });
    text(doc, 'Response within 1 business day', MARGIN + 8, y + 32, { size: 8, color: [180, 220, 218] });

    pageFooter(doc, doc.internal.getNumberOfPages(), totalPages, proposalId, portalDomain);
    return { doc: doc, proposalId: proposalId };
  }

  async function sendEmail(input, proposalId, pdfBase64, pdfFilename) {
    try {
      var cfg = window.TrendzactConfig || {};
      if (!cfg.portalSecret || cfg.portalSecret === 'REPLACE_ME_WITH_GENERATED_SECRET') {
        return { ok: false, code: 'NO_SECRET', error: 'Portal shared secret not configured in portal-config.js.' };
      }
      var endpoint = cfg.sendProposalUrl || '/api/send-proposal';
      var draft = input.draft || {};
      var allTiers = input.allTiers || [];
      var calc1 = allTiers[0] || input.calculation || {};
      var totals = calc1.totals || {};
      var partnerEmail = (input.partnerEmail || '').trim();
      if (!partnerEmail) return { ok: false, code: 'NO_PARTNER_EMAIL', error: 'Partner email not available — email not sent.' };

      var ccList = [];
      if (input.ccTo && input.ccTo.trim()) {
        ccList = input.ccTo.split(/[,;]/).map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 0; });
      }

      var payload = {
        to: partnerEmail,
        company: draft.companyName || '',
        contact: draft.contactName || '',
        contactEmail: draft.contactEmail || '',
        proposalId: proposalId,
        useCase: draft.primaryUseCase || '',
        annualRecurring: totals.annualRecurringMsrp || null,
        tcv: totals.tcvMsrp || null,
        termYears: totals.contractYears || draft.contractYears || 1,
        pdfBase64: pdfBase64,
        pdfFilename: pdfFilename,
        cc: ccList
      };

      var resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Portal-Secret': cfg.portalSecret },
        body: JSON.stringify(payload)
      });
      var body = null;
      try { body = await resp.json(); } catch (e) { /* non-JSON response */ }
      if (!resp.ok) {
        return { ok: false, code: 'HTTP_' + resp.status, error: (body && (body.error || body.message)) || 'Email service returned ' + resp.status };
      }
      return { ok: true, resendId: body && body.resendId };
    } catch (e) {
      console.error('[ProposalRender] sendEmail threw:', e);
      return { ok: false, code: 'NETWORK_ERROR', error: e.message || String(e) };
    }
  }

  function render(input) {
    var built = buildPdf(input);
    var safeCo = (input.draft.companyName || 'prospect').replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 30);
    var filename = 'trendzact-proposal-' + safeCo + '-' + built.proposalId + '.pdf';
    var dataUri = built.doc.output('datauristring');
    var commaIdx = dataUri.indexOf(',');
    var pdfBase64 = commaIdx >= 0 ? dataUri.substring(commaIdx + 1) : dataUri;
    built.doc.save(filename);
    var emailPromise = sendEmail(input, built.proposalId, pdfBase64, filename);
    return { proposalId: built.proposalId, filename: filename, emailPromise: emailPromise };
  }

  window.TrendzactProposalRender = { render: render };
})();