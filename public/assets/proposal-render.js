// Trendzact Partners - Proposal PDF Renderer (v7)
//
// Produces TWO PDFs from one build pass:
//   • Client-facing doc (pages 1-2): Cover + Scope & List Price Pricing.
//   • Reseller/distributor doc (pages 1-4): the client pages PLUS Next Steps
//     and the Distributor-Reseller channel worksheet. This is the emailed copy.
//
//   Page 1 — Cover: prospect details + List Price commitment options       [both]
//   Page 2 — Scope & List Price Pricing: inputs, line items, commitment    [both]
//   Page 3 — Next Steps + disclaimer + contact                        [reseller]
//   Page 4 — Distributor-Reseller Worksheet (channel pricing)          [reseller]
//
// Public API:
//   window.TrendzactProposalRender.render({ draft, allTiers, catalog, partnerEmail, ccTo })
//     -> { proposalId, filename, clientFilename, resellerFilename, emailPromise }
//     Triggers TWO browser downloads (client + reseller); emails the reseller doc.

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

  function fmt(n) {
    if (n == null || isNaN(n)) return '$0';
    return '$' + Math.round(n).toLocaleString('en-US');
  }

  function pct(n) { return Math.round(n * 100) + '%'; }

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

  function hRule(doc, x1, x2, y, color) {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(0.2);
    doc.line(x1, y, x2, y);
  }

  function pageHeader(doc, title, proposalId) {
    fillRect(doc, 0, 0, PAGE_W, 14, C.tintLight);
    text(doc, title, MARGIN, 9.5, { size: 11, style: 'bold', color: C.darkGray });
    text(doc, proposalId, PAGE_W - MARGIN, 9.5, { size: 8, color: C.medGray, align: 'right' });
  }

  function pageFooter(doc, proposalId, portalDomain) {
    var domainLabel = portalDomain || 'partner portal';
    text(doc, 'Trendzact  \u00b7  ' + proposalId + '  \u00b7  Confidential', MARGIN, PAGE_H - 8, { size: 7, color: C.medGray });
    text(doc, domainLabel, PAGE_W - MARGIN, PAGE_H - 8, { size: 7, color: C.medGray, align: 'right' });
  }

  // ================================================================
  //  Build the PDF
  // ================================================================
  function buildPdf(input, opts) {
    opts = opts || {};
    var draft = input.draft || {};
    var allTiers = input.allTiers || [];
    var catalog = input.catalog || {};
    var calc = allTiers[0] || {};
    var partnerEmail = input.partnerEmail || '';
    var jspdf = window.jspdf;
    if (!jspdf || !jspdf.jsPDF) throw new Error('jsPDF library not loaded');

    var doc = new jspdf.jsPDF({ unit: 'mm', format: 'a4' });
    var proposalId = calc.proposalId;
    var inp = calc.input || {};
    var generatedAt = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    var portalDomain = (window.location && window.location.hostname) || 'partner portal';
    var subdomain = inp.subdomain || '';

    // Resolve channel config for page 4. resolveChannelConfig falls back to
    // catalog.defaultChannel (INDIRECT two-tier) when subdomain doesn't match.
    var channelConfig = window.TrendzactMath
        ? window.TrendzactMath.resolveChannelConfig(catalog, subdomain)
        : (catalog.defaultChannel || { label: 'INDIRECT', regularDistDiscount: 0.4, regularResellerDiscount: 0.3, enhDistDiscount: 0.5, enhResellerDiscount: 0.35 });

    var tableLeft = MARGIN;
    var tableRight = PAGE_W - MARGIN;
    var tableWidth = tableRight - tableLeft;
    var colCount = allTiers.length || 1;


    // ================================================================
    //  PAGE 1 \u2014 COVER
    // ================================================================

    // Dark header banner
    fillRect(doc, 0, 0, PAGE_W, 52, C.darkGray);
    fillRect(doc, 0, 52, PAGE_W, 2, C.darkGreen);

    // Logo mark
    fillRect(doc, MARGIN, 16, 10, 10, C.darkGreen);
    doc.setDrawColor(C.white[0], C.white[1], C.white[2]);
    doc.setLineWidth(0.6);
    doc.line(MARGIN + 2, 19, MARGIN + 8, 19);
    doc.line(MARGIN + 5, 19, MARGIN + 5, 25);
    text(doc, 'Trendzact', MARGIN + 14, 21, { size: 14, style: 'bold', color: C.white });
    text(doc, 'PARTNERS', MARGIN + 14, 25.5, { size: 7, color: [180, 220, 218] });
    text(doc, 'PROPOSAL', PAGE_W - MARGIN, 21, { size: 10, style: 'bold', color: C.white, align: 'right' });
    text(doc, proposalId, PAGE_W - MARGIN, 25.5, { size: 8, color: [180, 220, 218], align: 'right' });

    // --- Cover title: the formatted proposal title as a prominent heading ---
    var coverTitle = (draft.proposalTitle && draft.proposalTitle.trim())
        ? 'Proposal for ' + (draft.companyName || 'Prospect') + ': ' + draft.proposalTitle.trim()
        : 'Proposal for ' + (draft.companyName || 'Prospect');
    var titleTopY = 63;
    var titleLineCount = lines(doc, coverTitle, MARGIN, titleTopY, CONTENT_W, { size: 15, style: 'bold', color: C.darkGray });
    var detailTopY = titleTopY + titleLineCount * 7 + 6;

    // --- Two-column detail section ---
    var detY = detailTopY;
    var leftX = MARGIN;
    var rightX = MARGIN + CONTENT_W / 2 + 4;

    // Left: Prepared For
    text(doc, 'PREPARED FOR', leftX, detY, { size: 8, style: 'bold', color: C.darkGreen });
    detY += 8;
    var leftItems = [
      ['Company', draft.companyName || '\u2014'],
      ['Contact', draft.contactName || '\u2014'],
      ['Email', draft.contactEmail || '\u2014']
    ];
    leftItems.forEach(function (row) {
      text(doc, row[0] + ':', leftX, detY, { size: 8, color: C.medGray });
      text(doc, row[1], leftX + 24, detY, { size: 9, style: 'bold', color: C.darkGray });
      detY += 7;
    });

    // Right: Proposal Details
    var rightY = detailTopY;
    text(doc, 'PROPOSAL DETAILS', rightX, rightY, { size: 8, style: 'bold', color: C.darkGreen });
    rightY += 8;
    var rightItems = [
      ['Licenses', (draft.userCount || 0).toLocaleString('en-US')],
      ['Est. Decision', draft.estimatedCloseDate || '\u2014']
    ];
    rightItems.forEach(function (row) {
      text(doc, row[0] + ':', rightX, rightY, { size: 8, color: C.medGray });
      text(doc, row[1], rightX + 28, rightY, { size: 9, style: 'bold', color: C.darkGray });
      rightY += 7;
    });

    // Use Case \u2014 full-width block spanning the page, above the divider
    var useCaseY = Math.max(detY, rightY) + 2;
    text(doc, 'USE CASE', leftX, useCaseY, { size: 8, style: 'bold', color: C.darkGreen });
    useCaseY += 6;
    var useCaseLineCount = lines(doc, draft.primaryUseCase || '\u2014', leftX, useCaseY, CONTENT_W, { size: 9, color: C.darkGray });

    // Divider
    var divY = useCaseY + useCaseLineCount * 4.5 + 2;
    hRule(doc, MARGIN, PAGE_W - MARGIN, divY, C.border);

    // Scope paragraph
    var paraY = divY + 6;
    var scopeNote = 'This proposal outlines a Trendzact GRC One deployment sized for the organization described above. ' +
        'List Price is  (USD $) and included for planning purposes and does not reflect VAT, use taxes, or tariffs. Final pricing is based on actual scope.  The Trendzact Sales Order is the final, authorized project amount and subject to Trendzact Deal Desk approval.';
    var paraLineCount = lines(doc, scopeNote, MARGIN, paraY, CONTENT_W, { size: 9, color: C.medGray });

    // --- List Price Commitment Options ---
    var boxY = paraY + paraLineCount * 4.5 + 10;
    var boxH = 72;
    var colW = CONTENT_W / colCount;
    var labelColor = [200, 200, 210];
    var valueColor = C.white;
    var highlightCol = [0, 180, 170];

    text(doc, 'List Price PRICING SUMMARY USD($)', MARGIN, boxY - 4, { size: 8, style: 'bold', color: C.darkGreen });

    fillRect(doc, MARGIN, boxY, CONTENT_W, boxH, C.darkGray);

    var tierTopY = boxY + 8;
    allTiers.forEach(function (t, idx) {
      var tt = t.totals || {};
      var cx = MARGIN + idx * colW;
      var midX = cx + colW / 2;
      var isLast = idx === colCount - 1;

      // Column divider
      if (idx > 0) {
        doc.setDrawColor(80, 85, 95);
        doc.setLineWidth(0.3);
        doc.line(cx, tierTopY, cx, boxY + boxH - 4);
      }

      // Tier label — single source of truth: catalog commitmentTiers[].label
      text(doc, (t.commitment && t.commitment.label) || (tt.contractYears + '-year'), midX, tierTopY + 4, { size: 10, style: 'bold', color: isLast ? highlightCol : valueColor, align: 'center' });

      // Annual recurring
      text(doc, 'Annual recurring', midX, tierTopY + 15, { size: 7, color: labelColor, align: 'center' });
      text(doc, fmt(tt.annualRecurringMsrp), midX, tierTopY + 21, { size: 11, style: 'bold', color: valueColor, align: 'center' });

      // One-time
      text(doc, 'One-time setup', midX, tierTopY + 30, { size: 7, color: labelColor, align: 'center' });
      text(doc, fmt(tt.oneTimeMsrp), midX, tierTopY + 36, { size: 9, style: 'bold', color: valueColor, align: 'center' });

      // TCV — column header already gives the tier
      text(doc, 'TCV', midX, tierTopY + 46, { size: 7, color: isLast ? highlightCol : labelColor, align: 'center' });
      text(doc, fmt(tt.tcvMsrp), midX, tierTopY + 53, { size: 14, style: 'bold', color: isLast ? highlightCol : C.tintDark, align: 'center' });
    });

    // Footer
    text(doc, 'Generated ' + generatedAt, MARGIN, 267, { size: 8, color: C.medGray });
    if (partnerEmail) text(doc, 'Prepared by ' + partnerEmail, PAGE_W - MARGIN, 267, { size: 8, color: C.medGray, align: 'right' });
    pageFooter(doc, proposalId, portalDomain);


    // ================================================================
    //  PAGE 2 \u2014 SCOPE & List Price PRICING
    // ================================================================
    doc.addPage();
    pageHeader(doc, 'Scope & List Price Pricing USD($)', proposalId);

    var y = 24;

    // --- Pricing Inputs ---
    text(doc, 'PRICING INPUTS', MARGIN, y, { size: 8, style: 'bold', color: C.darkGreen });
    y += 7;

    var segLabel = inp.companySegmentLabel || '\u2014';
    var licenseCount = inp.userCount || 0;
    var moduleCount = inp.moduleCount || 0;
    var bracketLabel = inp.bracket || '\u2014';

    text(doc, 'Company size:', MARGIN, y, { size: 8, color: C.medGray });
    text(doc, segLabel, MARGIN + 30, y, { size: 9, style: 'bold', color: C.darkGray });
    text(doc, 'Volume bracket:', MARGIN + CONTENT_W / 2, y, { size: 8, color: C.medGray });
    text(doc, bracketLabel, MARGIN + CONTENT_W / 2 + 32, y, { size: 9, style: 'bold', color: C.darkGray });
    y += 6;
    text(doc, 'Monitored users:', MARGIN, y, { size: 8, color: C.medGray });
    text(doc, licenseCount.toLocaleString('en-US'), MARGIN + 30, y, { size: 9, style: 'bold', color: C.darkGray });
    text(doc, 'Module count:', MARGIN + CONTENT_W / 2, y, { size: 8, color: C.medGray });
    text(doc, moduleCount + ' modules', MARGIN + CONTENT_W / 2 + 32, y, { size: 9, style: 'bold', color: C.darkGray });
    y += 10;

    hRule(doc, MARGIN, PAGE_W - MARGIN, y, C.border);
    y += 8;

    // Lines from the 1-year calc - shared by the LINE ITEMS table below.
    var calcLines = calc.lines || [];
    // Per-user values rendered with cent precision so per-user x qty reconciles.
    var pu = (window.TrendzactMath && window.TrendzactMath.formatPerUser) || function (n) { return fmt(n); };

    // --- Line Items ---
    text(doc, 'LINE ITEMS', MARGIN, y, { size: 8, style: 'bold', color: C.darkGreen });
    y += 7;

    // Column positions (mm). SKU left, Description, then 4 right-aligned
    // numeric columns ending at the page margin, in order Unit / Qty / Line
    // total / Timing. Numbers right-anchored to:
    //   timing  = PAGE_W - MARGIN - 3   (far right)
    //   lineTot = timing - 22
    //   qty     = lineTot - 20
    //   unit    = qty - 20
    var colTimingX = PAGE_W - MARGIN - 3;
    var colLineTotX = colTimingX - 22;
    var colQtyX = colLineTotX - 20;
    var colUnitX = colQtyX - 20;
    var descMaxX = colUnitX - 4; // leave 4mm before unit col

    function renderLineItemsHeader() {
      fillRect(doc, tableLeft, y, tableWidth, lineHeaderH, C.tintLight);
      text(doc, 'SKU', MARGIN + 2, y + 5.5, { size: 7.5, style: 'bold', color: C.darkGray });
      text(doc, 'Description', MARGIN + 28, y + 5.5, { size: 7.5, style: 'bold', color: C.darkGray });
      text(doc, 'Unit price', colUnitX, y + 5.5, { size: 7.5, style: 'bold', color: C.darkGray, align: 'right' });
      text(doc, 'Line total', colLineTotX, y + 5.5, { size: 7.5, style: 'bold', color: C.darkGray, align: 'right' });
      text(doc, 'Timing', colTimingX, y + 5.5, { size: 7.5, style: 'bold', color: C.darkGray, align: 'right' });
      text(doc, 'Qty', colQtyX, y + 5.5, { size: 7.5, style: 'bold', color: C.darkGray, align: 'right' });
      hRule(doc, tableLeft, tableRight, y + lineHeaderH, C.border);
      y += lineHeaderH;
    }

    var lineHeaderH = 8;
    renderLineItemsHeader();

    var lineRowH = 7;
    var pageBreakAt = PAGE_H - 30;
    // Truncate description so it doesn't run into the numeric columns.
    // ~46 chars fits the description column at 8pt now that Qty narrows it.
    var descCharCap = 46;
    calcLines.forEach(function (l, i) {
      if (y > pageBreakAt) {
        pageFooter(doc, proposalId, portalDomain);
        doc.addPage();
        pageHeader(doc, 'Scope & List Price Pricing (continued)', proposalId);
        y = 24;
        renderLineItemsHeader();
      }
      if (i % 2 === 1) fillRect(doc, tableLeft, y, tableWidth, lineRowH, [250, 250, 251]);
      var name = l.name || '';
      if (name.length > descCharCap) name = name.slice(0, descCharCap - 1) + '\u2026';
      var unitCell = (l.msrpPerUser && l.msrpPerUser > 0)
          ? pu(l.msrpPerUser) + '/user'
          : fmt(l.unitMsrp != null ? l.unitMsrp : l.msrpLine);
      var qtyVal = (l.qty != null ? l.qty : 1);
      text(doc, l.code, MARGIN + 2, y + 5, { size: 8, color: C.darkGray });
      text(doc, name, MARGIN + 28, y + 5, { size: 8, color: C.darkGray });
      text(doc, unitCell, colUnitX, y + 5, { size: 7.5, color: C.darkGray, align: 'right' });
      text(doc, fmt(l.msrpLine), colLineTotX, y + 5, { size: 8, color: C.darkGray, align: 'right' });
      text(doc, l.timing === 'oneTime' ? 'One-time' : 'Annual', colTimingX, y + 5, { size: 7.5, color: C.medGray, align: 'right' });
      text(doc, qtyVal.toLocaleString('en-US'), colQtyX, y + 5, { size: 8, style: l.qtyOverridden ? 'bold' : 'normal', color: l.qtyOverridden ? C.darkGreen : C.darkGray, align: 'right' });
      hRule(doc, tableLeft, tableRight, y + lineRowH, C.border);
      y += lineRowH;
    });

    y += 4;
    hRule(doc, MARGIN, PAGE_W - MARGIN, y, C.border);
    y += 8;

    // --- Commitment Options Table ---
    text(doc, 'List Price WITH ANNUAL COMMITMENT OPTIONS', MARGIN, y, { size: 8, style: 'bold', color: C.darkGreen });
    y += 7;

    // Header row - commitment label from catalog drives the column header on
    // both page 1 and page 2 (single source of truth).
    var tierColW = (CONTENT_W - 44) / colCount;
    fillRect(doc, tableLeft, y - 2, tableWidth, 9, C.tintLight);
    allTiers.forEach(function (t, idx) {
      var colCenter = MARGIN + 44 + idx * tierColW + tierColW / 2;
      var hdr = (t.commitment && t.commitment.label) || (t.totals.contractYears + '-year');
      text(doc, hdr, colCenter, y + 3.5, { size: 8, style: 'bold', color: C.darkGray, align: 'center' });
    });
    hRule(doc, tableLeft, tableRight, y + 7, C.border);
    y += 9;

    // Data rows - "TCV" is the agreed shorthand; column header gives the tier.
    var commitRows = [
      { label: 'Annual recurring', key: 'annualRecurringMsrp' },
      { label: 'One-time setup', key: 'oneTimeMsrp' },
      { label: 'TCV', key: 'tcvMsrp', bold: true }
    ];
    commitRows.forEach(function (row) {
      var isBold = row.bold;
      if (isBold) fillRect(doc, tableLeft, y - 2, tableWidth, 10, C.tintLight);
      text(doc, row.label, MARGIN + 2, y + 3.5, { size: 8.5, style: isBold ? 'bold' : 'normal', color: C.darkGray });
      allTiers.forEach(function (t, idx) {
        var colCenter = MARGIN + 44 + idx * tierColW + tierColW / 2;
        var val = t.totals[row.key] || 0;
        text(doc, fmt(val), colCenter, y + 3.5, { size: isBold ? 10 : 9, style: 'bold', color: isBold ? C.darkGreen : C.darkGray, align: 'center' });
      });
      hRule(doc, tableLeft, tableRight, y + (isBold ? 8 : 6), C.border);
      y += isBold ? 10 : 8;
    });

    y += 6;

    // Validity \u2014 match page 1's long date format ("Generated May 25, 2026")
    y += 4;
    var issuedAt = new Date();
    var expiresAt = new Date(issuedAt.getTime());
    expiresAt.setUTCDate(expiresAt.getUTCDate() + 90);
    var dateFmt = { year: 'numeric', month: 'long', day: 'numeric' };
    text(doc, 'List Price pricing valid for 90 days. Issued ' + issuedAt.toLocaleDateString('en-US', dateFmt) + '  \u00b7  Expires ' + expiresAt.toLocaleDateString('en-US', dateFmt) + '.', MARGIN, y + 3, { size: 7.5, style: 'italic', color: C.medGray });

    pageFooter(doc, proposalId, portalDomain);

    // Client-facing document stops here: pages 1-2 only (cover + scope &
    // pricing). The reseller/distributor document continues with Next Steps
    // and the channel worksheet below.
    if (opts.clientOnly) {
      return { doc: doc, proposalId: proposalId };
    }


    // ================================================================
    //  PAGE 3 \u2014 NEXT STEPS
    // ================================================================
    doc.addPage();
    pageHeader(doc, 'Next Steps', proposalId);

    y = 28;
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
    var discWrapW = CONTENT_W - 10;
    var discIntro = 'This proposal outlines a Trendzact GRC One deployment sized for the organization described above. ' +
        'List Price is (USD $) and included for planning purposes and does not reflect VAT, use taxes, or tariffs. ' +
        'Final pricing is based on actual scope. ' +
        'The Trendzact Sales Order is the final, authorized project amount and subject to Trendzact Deal Desk approval.';
    var disc = 'List Price pricing shown is based on information provided at the time of generation. ' +
        'Actual Retail Price at the discretion of the Distributor and their Resellers. ' +
        'Final pricing is subject to Trendzact Deal Desk review, volume tier approval, deployment scope, and executed terms. ' +
        'This document is confidential and intended only for the named partner and prospect.';
    // Size the box to fit both paragraphs (measure wrapped line counts at 8pt).
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    var discLineH = 3.3;
    var introCount = doc.splitTextToSize(discIntro, discWrapW).length;
    var discCount = doc.splitTextToSize(disc, discWrapW).length;
    var discBoxH = 14 + introCount * discLineH + 3 + discCount * discLineH + 4;
    fillRect(doc, MARGIN, y, CONTENT_W, discBoxH, C.tintLight);
    text(doc, 'Disclaimer', MARGIN + 5, y + 8, { size: 9, style: 'bold', color: C.darkGray });
    var discTextY = y + 14;
    lines(doc, discIntro, MARGIN + 5, discTextY, discWrapW, { size: 8, color: C.medGray });
    discTextY += introCount * discLineH + 3;
    lines(doc, disc, MARGIN + 5, discTextY, discWrapW, { size: 8, color: C.medGray });
    y += discBoxH + 6;

    fillRect(doc, MARGIN, y, CONTENT_W, 38, C.darkGray);
    text(doc, 'Questions?', MARGIN + 8, y + 12, { size: 13, style: 'bold', color: C.white });
    text(doc, 'Partner Deal Desk', MARGIN + 8, y + 20, { size: 9, color: [180, 220, 218] });
    text(doc, 'deal-desk@trendzact.com', MARGIN + 8, y + 26, { size: 11, style: 'bold', color: C.white });
    text(doc, 'Response within 1 business day', MARGIN + 8, y + 32, { size: 8, color: [180, 220, 218] });

    pageFooter(doc, proposalId, portalDomain);


    // ================================================================
    //  PAGE 4 \u2014 DISTRIBUTOR\u2013RESELLER WORKSHEET
    // ================================================================
    doc.addPage();
    pageHeader(doc, 'Distributor\u2013Reseller Worksheet', proposalId);

    y = 24;

    // Channel info \u2014 label comes from the subdomain (if matched) or the
    // catalog's defaultChannel.label (INDIRECT for the two-tier fallback).
    var channelLabel = subdomain
      ? subdomain.toUpperCase()
      : (channelConfig.label || 'INDIRECT').toUpperCase();
    text(doc, 'CHANNEL: ' + channelLabel, MARGIN, y, { size: 8, style: 'bold', color: C.darkGreen });
    y += 6;

    // Derived margin percentages (sum to 100% per row). Regular and enhancement
    // SKUs use the same 60/10/30 split, so a single line covers both.
    //   Trendzact wholesale = 1 - distDiscount
    //   Distributor margin  = distDiscount - resellerDiscount
    //   Reseller margin     = resellerDiscount
    var tzWholesale = 1 - channelConfig.regularDistDiscount;
    var distMargin = channelConfig.regularDistDiscount - channelConfig.regularResellerDiscount;
    var resellerMargin = channelConfig.regularResellerDiscount;

    text(doc, 'Trendzact wholesale ' + pct(tzWholesale) + '    Distributor margin ' + pct(distMargin) + '    Reseller margin ' + pct(resellerMargin), MARGIN, y, { size: 8, color: C.medGray });
    y += 8;

    hRule(doc, MARGIN, PAGE_W - MARGIN, y, C.border);
    y += 6;

    // Margin summary for all commitment tiers
    text(doc, 'MARGIN SUMMARY WITH ANNUAL COMMITMENT OPTIONS', MARGIN, y, { size: 8, style: 'bold', color: C.darkGreen });
      y += 8;

      // Column layout: label column + one column per tier
      var marginLabelW = 56;
      var marginTierColW = (CONTENT_W - marginLabelW) / colCount;

      // Header row — use catalog commitment label
      fillRect(doc, tableLeft, y - 2, tableWidth, 9, C.tintLight);
      allTiers.forEach(function (t, idx) {
        var colCenter = MARGIN + marginLabelW + idx * marginTierColW + marginTierColW / 2;
        var hdr = (t.commitment && t.commitment.label) || (t.totals.contractYears + '-year');
        text(doc, hdr, colCenter, y + 3.5, { size: 8, style: 'bold', color: C.darkGray, align: 'center' });
      });
      hRule(doc, tableLeft, tableRight, y + 7, C.border);
      y += 9;

      // Margin rows — RECURRING
      y += 1;
      text(doc, 'RECURRING', MARGIN + 2, y + 3.5, { size: 7, style: 'bold', color: C.medGray });
      hRule(doc, tableLeft, tableRight, y + 6, C.border);
      y += 8;

      // Effective channel % is computed from the math engine's per-line totals
      // so enhancement SKUs (deeper discount) blend in correctly. Commit factor
      // scales numerator and denominator equally, so % is tier-independent —
      // pick tier 0 to derive labels.
      var t0Totals = (allTiers[0] && allTiers[0].totals) || {};
      var t0AnnualMsrp = t0Totals.annualRecurringMsrp || 0;
      var blendedTzNetPct = t0AnnualMsrp > 0 ? Math.round((t0Totals.annualTrendzactNet || 0) / t0AnnualMsrp * 100) : 0;
      var blendedDistPct = t0AnnualMsrp > 0 ? Math.round((t0Totals.annualDistRetains || 0) / t0AnnualMsrp * 100) : 0;
      var blendedResellerPct = t0AnnualMsrp > 0 ? Math.round((t0Totals.annualResellerRetains || 0) / t0AnnualMsrp * 100) : 0;

      // List Price per Year
      function marginRow(label, isBold, valueFn) {
        if (isBold) fillRect(doc, tableLeft, y - 2, tableWidth, 10, C.tintLight);
        text(doc, label, MARGIN + 2, y + 3.5, { size: 8.5, style: isBold ? 'bold' : 'normal', color: C.darkGray });
        allTiers.forEach(function (t, idx) {
          var colCenter = MARGIN + marginLabelW + idx * marginTierColW + marginTierColW / 2;
          text(doc, fmt(valueFn(t)), colCenter, y + 3.5, { size: isBold ? 9 : 8.5, style: 'bold', color: isBold ? C.darkGreen : C.darkGray, align: 'center' });
        });
        hRule(doc, tableLeft, tableRight, y + (isBold ? 8 : 6), C.border);
        y += isBold ? 10 : 8;
      }

      marginRow('List Price per Year', false, function (t) { return t.totals.annualRecurringMsrp || 0; });
      marginRow('List Price Commitment', true, function (t) { return (t.totals.annualRecurringMsrp || 0) * (t.totals.contractYears || 1); });
      marginRow('Trendzact wholesale price (' + blendedTzNetPct + '%)', false, function (t) {
        return (t.totals.annualTrendzactNet || 0) * (t.totals.contractYears || 1);
      });
      marginRow('Distributor retains (' + blendedDistPct + '%)', false, function (t) {
        return (t.totals.annualDistRetains || 0) * (t.totals.contractYears || 1);
      });
      marginRow('Reseller retains (' + blendedResellerPct + '%)', false, function (t) {
        return (t.totals.annualResellerRetains || 0) * (t.totals.contractYears || 1);
      });

      // ONE-TIME
      y += 2;
      text(doc, 'ONE-TIME', MARGIN + 2, y + 3.5, { size: 7, style: 'bold', color: C.medGray });
      hRule(doc, tableLeft, tableRight, y + 6, C.border);
      y += 8;

      var t1 = allTiers[0] ? allTiers[0].totals : {};
      var otMsrp = t1.oneTimeMsrp || 0;
      var otTzNet = t1.oneTimeTrendzactNet || 0;
      var otDistRetains = t1.oneTimeDistRetains || 0;
      var otResellerRetains = t1.oneTimeResellerRetains || 0;
      var otTzPct = otMsrp > 0 ? Math.round((otTzNet / otMsrp) * 100) : 0;
      var otDistPct = otMsrp > 0 ? Math.round((otDistRetains / otMsrp) * 100) : 0;
      var otResellerPct = otMsrp > 0 ? Math.round((otResellerRetains / otMsrp) * 100) : 0;

      marginRow('List Price', true, function () { return otMsrp; });
      marginRow('Trendzact wholesale price (' + otTzPct + '%)', false, function () { return otTzNet; });
      marginRow('Distributor retains (' + otDistPct + '%)', false, function () { return otDistRetains; });
      marginRow('Reseller retains (' + otResellerPct + '%)', false, function () { return otResellerRetains; });

      // TOTAL (recurring commitment + one-time)
      y += 2;
      text(doc, 'TOTAL (RECURRING + ONE-TIME)', MARGIN + 2, y + 3.5, { size: 7, style: 'bold', color: C.medGray });
      hRule(doc, tableLeft, tableRight, y + 6, C.border);
      y += 8;

      marginRow('Trendzact wholesale price total', true, function (t) {
        return (t.totals.annualTrendzactNet || 0) * (t.totals.contractYears || 1) + otTzNet;
      });
      marginRow('Distributor retains total', true, function (t) {
        return (t.totals.annualDistRetains || 0) * (t.totals.contractYears || 1) + otDistRetains;
      });
      marginRow('Reseller retains total', true, function (t) {
        return (t.totals.annualResellerRetains || 0) * (t.totals.contractYears || 1) + otResellerRetains;
      });

    y += 4;

    y += 4;
    text(doc, 'This page is for partner internal use and should not be shared with the end customer.', MARGIN, y, { size: 7.5, style: 'italic', color: C.medGray });

    pageFooter(doc, proposalId, portalDomain);

    return { doc: doc, proposalId: proposalId };
  }


  // ================================================================
  //  Email
  // ================================================================
  async function sendEmail(input, proposalId, pdfBase64, pdfFilename) {
    try {
      var cfg = window.TrendzactConfig || {};
      if (!cfg.portalSecret || cfg.portalSecret === 'REPLACE_ME_WITH_GENERATED_SECRET') {
        return { ok: false, code: 'NO_SECRET', error: 'Portal shared secret not configured in portal-config.js.' };
      }
      var endpoint = cfg.sendProposalUrl || '/api/send-proposal';
      var draft = input.draft || {};
      var allTiers = input.allTiers || [];
      var calc1 = allTiers[0] || {};
      var totals = calc1.totals || {};
      var partnerEmail = (input.partnerEmail || '').trim();
      if (!partnerEmail) return { ok: false, code: 'NO_PARTNER_EMAIL', error: 'Partner email not available \u2014 email not sent.' };

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
    // Reseller/distributor document: the full 4-page PDF. This is also the
    // copy attached to the email.
    var reseller = buildPdf(input);

    // Decompose unicode then strip diacritical marks so "Société Générale" →
    // "societe-generale" instead of an empty string after the ASCII filter.
    var safeCo = String(input.draft.companyName || 'prospect')
        .normalize('NFD').replace(/[^\x00-\x7f]/g, '')
        .replace(/[^a-z0-9]+/gi, '-').toLowerCase()
        .replace(/^-+|-+$/g, '')
        .slice(0, 30) || 'prospect';
    var base = 'trendzact-proposal-' + safeCo + '-' + reseller.proposalId;
    // Client doc keeps the clean name (it's the one forwarded to the prospect);
    // the reseller doc is suffixed to mark it as partner-internal.
    var clientFilename = base + '.pdf';
    var resellerFilename = base + '-reseller.pdf';

    // Base64 of the reseller doc for the email attachment.
    var dataUri = reseller.doc.output('datauristring');
    var commaIdx = dataUri.indexOf(',');
    var pdfBase64 = commaIdx >= 0 ? dataUri.substring(commaIdx + 1) : dataUri;

    // Client-facing document: cover + scope & pricing only (pages 1-2).
    var client = buildPdf(input, { clientOnly: true });

    // Download both. Browsers suppress a second download fired immediately
    // after the first, so stagger them — save the client doc first (the one
    // forwarded to the prospect), then the reseller doc after a short delay.
    client.doc.save(clientFilename);
    setTimeout(function () { reseller.doc.save(resellerFilename); }, 1200);

    var emailPromise = sendEmail(input, reseller.proposalId, pdfBase64, resellerFilename);
    return {
      proposalId: reseller.proposalId,
      filename: resellerFilename,        // back-compat: primary (emailed) doc
      clientFilename: clientFilename,
      resellerFilename: resellerFilename,
      emailPromise: emailPromise
    };
  }

  window.TrendzactProposalRender = { render: render };
})();