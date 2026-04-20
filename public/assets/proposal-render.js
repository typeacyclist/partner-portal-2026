// Trendzact Partners - Proposal PDF Renderer
//
// Track C implementation. Takes a draft + calculation + catalog and produces
// a 3-page PDF using jsPDF (already loaded via CDN on /proposal page).
//
// Public API:
//   window.TrendzactProposalRender.render({ draft, calculation, catalog, partnerEmail })
//     -> { proposalId, filename }   (also triggers browser download)

(function () {
  'use strict';

  // Brand palette (RGB)
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

  function pageFooter(doc, pageNum, totalPages, proposalId) {
    text(doc, 'Trendzact GRC1 - Partner Proposal', MARGIN, PAGE_H - 8, { size: 8, color: C.medGray });
    text(doc, 'Page ' + pageNum + ' of ' + totalPages, PAGE_W - MARGIN, PAGE_H - 8, { size: 8, color: C.medGray, align: 'right' });
    text(doc, proposalId + ' - Confidential. For partner and named prospect use only.',
         PAGE_W / 2, PAGE_H - 8, { size: 8, color: C.medGray, align: 'center' });
  }

  function buildPdf(input) {
    var draft = input.draft;
    var calc = input.calculation;
    var partnerEmail = input.partnerEmail || '';

    var jspdf = window.jspdf;
    if (!jspdf || !jspdf.jsPDF) throw new Error('jsPDF library not loaded');

    var doc = new jspdf.jsPDF({ unit: 'mm', format: 'a4' });
    var proposalId = calc.proposalId;
    var generatedAt = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    var totalPages = 3;

    // ============== PAGE 1 - COVER ==============
    fillRect(doc, 0, 0, PAGE_W, 52, C.darkGray);
    fillRect(doc, 0, 52, PAGE_W, 2, C.darkGreen);

    // Brand mark - simple T
    fillRect(doc, MARGIN, 16, 10, 10, C.darkGreen);
    doc.setDrawColor(C.white[0], C.white[1], C.white[2]);
    doc.setLineWidth(0.6);
    doc.line(MARGIN + 2, 19, MARGIN + 8, 19);
    doc.line(MARGIN + 5, 19, MARGIN + 5, 25);
    text(doc, 'Trendzact', MARGIN + 14, 21, { size: 14, style: 'bold', color: C.white });
    text(doc, 'PARTNERS', MARGIN + 14, 25.5, { size: 7, color: [180, 220, 218] });
    text(doc, 'PROPOSAL', PAGE_W - MARGIN, 21, { size: 10, style: 'bold', color: C.white, align: 'right' });
    text(doc, proposalId, PAGE_W - MARGIN, 25.5, { size: 8, color: [180, 220, 218], align: 'right' });

    text(doc, 'Prepared for', MARGIN, 72, { size: 9, color: C.medGray });
    text(doc, draft.companyName || 'Prospect', MARGIN, 82, { size: 24, style: 'bold', color: C.darkGray });
    if (draft.contactName) {
      text(doc, 'Primary contact: ' + draft.contactName, MARGIN, 90, { size: 10, color: C.medGray });
    }

    // Key details block
    var yKd = 110;
    fillRect(doc, MARGIN, yKd, CONTENT_W, 44, C.tintLight);
    doc.setDrawColor(C.medGreen[0], C.medGreen[1], C.medGreen[2]);
    doc.setLineWidth(0.4);
    doc.line(MARGIN, yKd, MARGIN, yKd + 44);

    var kv = [
      ['Primary use case',  draft.primaryUseCase || '—'],
      ['Deal stage',        draft.dealStage || '—'],
      ['Estimated close',   draft.estimatedCloseDate || '—'],
      ['Licensed users',    (draft.userCount || 0).toLocaleString('en-US')]
    ];
    kv.forEach(function (row, i) {
      var col = i % 2;
      var r = Math.floor(i / 2);
      var cx = MARGIN + 6 + col * (CONTENT_W / 2);
      var cy = yKd + 10 + r * 18;
      text(doc, row[0].toUpperCase(), cx, cy, { size: 7, color: C.medGray });
      text(doc, String(row[1]), cx, cy + 6, { size: 11, style: 'bold', color: C.darkGray });
    });

    // Intro paragraph
    var intro = 'This proposal outlines a Trendzact GRC1 deployment scoped to ' + (draft.companyName || 'the prospect') +
                "'s priority use case and risk profile. Indicative pricing is included for planning purposes. " +
                'Final pricing, terms, and deployment scope are subject to Trendzact Deal Desk approval.';
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(C.darkGray[0], C.darkGray[1], C.darkGray[2]);
    var introLines = doc.splitTextToSize(intro, CONTENT_W);
    doc.text(introLines, MARGIN, 168);

    // Year 1 hero
    fillRect(doc, MARGIN, 200, CONTENT_W, 44, C.darkGray);
    text(doc, 'YEAR 1 INDICATIVE TOTAL', MARGIN + 8, 212, { size: 8, color: [200, 200, 210] });
    text(doc, fmt(calc.totals.year1AnnualUsd), MARGIN + 8, 232, { size: 28, style: 'bold', color: C.white });
    var subline = fmt(calc.totals.recurringYear1Usd) + ' recurring   +   ' + fmt(calc.totals.oneTimeUsd) + ' one-time';
    text(doc, subline, PAGE_W - MARGIN - 8, 232, { size: 10, color: [180, 220, 218], align: 'right' });

    // Footer
    text(doc, 'Generated ' + generatedAt, MARGIN, 265, { size: 8, color: C.medGray });
    if (partnerEmail) text(doc, 'Prepared by ' + partnerEmail, PAGE_W - MARGIN, 265, { size: 8, color: C.medGray, align: 'right' });
    pageFooter(doc, 1, totalPages, proposalId);

    // ============== PAGE 2 - LINE ITEMS ==============
    doc.addPage();
    fillRect(doc, 0, 0, PAGE_W, 14, C.tintLight);
    text(doc, 'Scope & Indicative Pricing', MARGIN, 9.5, { size: 11, style: 'bold', color: C.darkGray });
    text(doc, proposalId, PAGE_W - MARGIN, 9.5, { size: 8, color: C.medGray, align: 'right' });

    var y = 28;
    text(doc, 'PACKAGING', MARGIN, y, { size: 8, color: C.medGreen });
    fillRect(doc, MARGIN, y + 2, 30, 0.8, C.medGreen);
    y += 12;
    text(doc, 'Line items for ' + (draft.companyName || 'the prospect'), MARGIN, y,
         { size: 14, style: 'bold', color: C.darkGray });
    y += 8;

    // Context line
    var ctx = (calc.input.companySegmentLabel || '') + '  |  ' +
              (calc.input.userCount || 0).toLocaleString('en-US') + ' users  |  ' +
              'Volume bracket: ' + (calc.input.bracket || '') + '  (\u00d7' + (calc.input.bracketMultiplier || 1).toFixed(2) + ')';
    text(doc, ctx, MARGIN, y, { size: 9, color: C.medGray });
    y += 10;

    // Table
    var cols = [
      { label: 'SKU',        x: MARGIN + 3,   w: 28,  align: 'left'  },
      { label: 'Description',x: MARGIN + 31,  w: 95,  align: 'left'  },
      { label: 'Unit',       x: MARGIN + 126, w: 28,  align: 'left'  },
      { label: 'Annual',     x: MARGIN + 154, w: 24,  align: 'right' }
    ];
    var tableLeft = MARGIN, tableRight = PAGE_W - MARGIN, tableWidth = tableRight - tableLeft;
    var headerH = 9, rowH = 8;

    // Header
    fillRect(doc, tableLeft, y, tableWidth, headerH, C.tintLight);
    doc.setDrawColor(C.border[0], C.border[1], C.border[2]);
    doc.setLineWidth(0.2);
    doc.line(tableLeft, y + headerH, tableRight, y + headerH);
    cols.forEach(function (col) {
      var tx = col.align === 'right' ? col.x + col.w - 2 : col.x;
      text(doc, col.label, tx, y + 6, { size: 8, style: 'bold', color: C.darkGray, align: col.align === 'right' ? 'right' : undefined });
    });
    y += headerH;

    // Rows
    var pageBreakAt = PAGE_H - 50;
    calc.lines.forEach(function (l, i) {
      if (y > pageBreakAt) {
        pageFooter(doc, doc.internal.getNumberOfPages(), totalPages, proposalId);
        doc.addPage();
        fillRect(doc, 0, 0, PAGE_W, 14, C.tintLight);
        text(doc, 'Scope & Pricing (continued)', MARGIN, 9.5, { size: 11, style: 'bold', color: C.darkGray });
        y = 28;
        // Re-render header
        fillRect(doc, tableLeft, y, tableWidth, headerH, C.tintLight);
        doc.line(tableLeft, y + headerH, tableRight, y + headerH);
        cols.forEach(function (col) {
          var tx = col.align === 'right' ? col.x + col.w - 2 : col.x;
          text(doc, col.label, tx, y + 6, { size: 8, style: 'bold', color: C.darkGray, align: col.align === 'right' ? 'right' : undefined });
        });
        y += headerH;
      }

      if (i % 2 === 1) fillRect(doc, tableLeft, y, tableWidth, rowH, [250, 250, 251]);
      var name = l.name + (l.timing === 'oneTime' ? ' (one-time)' : '');
      // Truncate name if too long
      if (name.length > 60) name = name.slice(0, 59) + '…';
      var row = [l.code, name, l.unitDescription, fmt(l.lineAmountUsd)];
      row.forEach(function (cell, ci) {
        var col = cols[ci];
        var tx = col.align === 'right' ? col.x + col.w - 2 : col.x;
        var cellText = String(cell);
        if (ci === 2 && cellText.length > 30) cellText = cellText.slice(0, 29) + '…';
        text(doc, cellText, tx, y + 5.5, { size: 8.5, color: C.darkGray, align: col.align === 'right' ? 'right' : undefined });
      });
      doc.setDrawColor(C.border[0], C.border[1], C.border[2]);
      doc.line(tableLeft, y + rowH, tableRight, y + rowH);
      y += rowH;
    });

    y += 4;

    // Totals block
    if (calc.bundleDiscount.discountAmountUsd > 0) {
      text(doc, 'Bundle discount (' + calc.bundleDiscount.eligibleModuleCount + ' modules, ' +
                calc.bundleDiscount.discountPct + '%):',
           MARGIN, y + 5, { size: 9, color: C.medGray });
      text(doc, '\u2212' + fmt(calc.bundleDiscount.discountAmountUsd), tableRight - 2, y + 5,
           { size: 9, color: C.darkGray, align: 'right' });
      y += 8;
    }

    fillRect(doc, tableLeft, y, tableWidth, 11, C.tintLight);
    doc.setDrawColor(C.medGreen[0], C.medGreen[1], C.medGreen[2]);
    doc.setLineWidth(0.4);
    doc.line(tableLeft, y, tableRight, y);
    text(doc, 'Year 1 Total (recurring + one-time)', MARGIN + 4, y + 7,
         { size: 10, style: 'bold', color: C.darkGray });
    text(doc, fmt(calc.totals.year1AnnualUsd), tableRight - 2, y + 7,
         { size: 12, style: 'bold', color: C.darkGreen, align: 'right' });
    y += 14;

    // Multi-year if applicable
    if ((draft.contractYears || 1) > 1) {
      text(doc, 'MULTI-YEAR', MARGIN, y, { size: 8, color: C.medGreen });
      y += 6;
      var rows = [
        ['Year 2 recurring (' + (100 - calc.multiYearContinuity.year2Pct) + '% of Y1)', fmt(calc.totals.recurringYear2Usd)]
      ];
      if (draft.contractYears >= 3) {
        rows.push(['Year 3 recurring (' + (100 - calc.multiYearContinuity.year3Pct) + '% of Y1)', fmt(calc.totals.recurringYear3Usd)]);
      }
      rows.push(['Total Contract Value (TCV)', fmt(calc.totals.tcvUsd)]);
      rows.forEach(function (rw, idx) {
        var bold = idx === rows.length - 1;
        text(doc, rw[0], MARGIN, y + 5, { size: 9, color: C.darkGray, style: bold ? 'bold' : 'normal' });
        text(doc, rw[1], tableRight - 2, y + 5, { size: 10, color: bold ? C.darkGreen : C.darkGray, align: 'right', style: bold ? 'bold' : 'normal' });
        y += 6;
      });
      y += 4;
    }

    // Notes
    if (draft.notes && draft.notes.trim()) {
      y += 4;
      text(doc, 'PROPOSAL NOTES', MARGIN, y, { size: 8, color: C.medGreen });
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(C.darkGray[0], C.darkGray[1], C.darkGray[2]);
      var notesLines = doc.splitTextToSize(draft.notes, CONTENT_W);
      doc.text(notesLines, MARGIN, y);
      y += notesLines.length * 4.5 + 4;
    }

    pageFooter(doc, doc.internal.getNumberOfPages(), totalPages, proposalId);

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
      ['03', 'Deal desk approval', 'Trendzact Deal Desk reviews final pricing, deployment terms, and packaging. Target turnaround: 2 business days.'],
      ['04', 'Order & provisioning', 'Sales order submitted by partner. Tenant provisioned and kickoff scheduled with Customer Success.']
    ];

    steps.forEach(function (s) {
      fillRect(doc, MARGIN, y - 4, 10, 10, C.darkGreen);
      text(doc, s[0], MARGIN + 5, y + 2.5, { size: 9, style: 'bold', color: C.white, align: 'center' });
      text(doc, s[1], MARGIN + 14, y, { size: 11, style: 'bold', color: C.darkGray });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(C.medGray[0], C.medGray[1], C.medGray[2]);
      var bLines = doc.splitTextToSize(s[2], CONTENT_W - 16);
      doc.text(bLines, MARGIN + 14, y + 5);
      y += 8 + bLines.length * 4.5 + 6;
    });

    // Disclaimer
    y += 4;
    fillRect(doc, MARGIN, y, CONTENT_W, 30, C.tintLight);
    text(doc, 'Disclaimer', MARGIN + 5, y + 8, { size: 9, style: 'bold', color: C.darkGray });
    var disc = 'Pricing shown is indicative and based on information provided at the time of generation. ' +
               'Final pricing is subject to Trendzact Deal Desk review, volume tier approval, deployment scope, and ' +
               'executed reseller terms. This document is confidential and intended only for the named partner and prospect.';
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(C.medGray[0], C.medGray[1], C.medGray[2]);
    var dLines = doc.splitTextToSize(disc, CONTENT_W - 10);
    doc.text(dLines, MARGIN + 5, y + 14);
    y += 36;

    // Contact block
    fillRect(doc, MARGIN, y, CONTENT_W, 38, C.darkGray);
    text(doc, 'Questions?', MARGIN + 8, y + 12, { size: 13, style: 'bold', color: C.white });
    text(doc, 'Partner Deal Desk', MARGIN + 8, y + 20, { size: 9, color: [180, 220, 218] });
    text(doc, 'deal-desk@trendzact.com', MARGIN + 8, y + 26, { size: 11, style: 'bold', color: C.white });
    text(doc, 'Response within 1 business day', MARGIN + 8, y + 32, { size: 8, color: [180, 220, 218] });

    pageFooter(doc, doc.internal.getNumberOfPages(), totalPages, proposalId);

    return { doc: doc, proposalId: proposalId };
  }

  function render(input) {
    var built = buildPdf(input);
    var safeCo = (input.draft.companyName || 'prospect').replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 30);
    var filename = 'trendzact-proposal-' + safeCo + '-' + built.proposalId + '.pdf';
    built.doc.save(filename);
    return { proposalId: built.proposalId, filename: filename };
  }

  window.TrendzactProposalRender = { render: render };
})();
