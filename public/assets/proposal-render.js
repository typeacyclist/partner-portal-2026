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

  function formatSectorLabel(sector) {
    if (!sector) return '—';
    if (sector === 'commercial') return 'Commercial';
    if (sector === 'govt-public-works') return 'Govt / Public Works';
    return String(sector)
      .split('-')
      .map(function (part) {
        return part ? part.charAt(0).toUpperCase() + part.slice(1) : part;
      })
      .join(' ');
  }

  function pageFooter(doc, pageNum, totalPages, proposalId, portalDomain) {
    var domainLabel = portalDomain || 'partner portal';
    text(doc, 'Trendzact GRC1 - Partner Proposal ' + proposalId + ' - Confidential. For ' + domainLabel + ' use only.',
         MARGIN, PAGE_H - 8, { size: 8, color: C.medGray });
    text(doc, 'Page ' + pageNum + ' of ' + totalPages, PAGE_W - MARGIN, PAGE_H - 8, { size: 8, color: C.medGray, align: 'right' });
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
    var portalDomain = (window.location && window.location.hostname) || 'partner portal';

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
    text(doc, 'Primary contact: ' + (draft.contactName || '—'), MARGIN, 80, { size: 10, color: C.medGray });
    var projectName = draft.proposalTitle && draft.proposalTitle.trim()
      ? draft.proposalTitle.trim()
      : '—';
    text(doc, 'Project Name: "' + projectName + '"', MARGIN, 86, { size: 10, color: C.medGray });
    text(doc, draft.companyName || 'Prospect', MARGIN, 97, { size: 22, style: 'bold', color: C.darkGray });

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

    // Pricing summary hero
    var contractYears = calc.totals.contractYears || draft.contractYears || 1;
    var page1BoxY = 198;
    var page1BoxH = 54;
    var page1LabelColor = [200, 200, 210];
    var page1ValueColor = C.white;
    fillRect(doc, MARGIN, page1BoxY, CONTENT_W, page1BoxH, C.darkGray);
    text(doc, 'INDICATIVE PRICING SUMMARY', MARGIN + 8, page1BoxY + 10, { size: 8, color: page1LabelColor });

    var pricingRows = [
      ['Year 1 Total (recurring + one-time)', fmt(calc.totals.year1AnnualUsd)],
      ['Year 2 recurring', contractYears >= 2 ? fmt(calc.totals.recurringYear2Usd) : '—'],
      ['Year 3 recurring', contractYears >= 3 ? fmt(calc.totals.recurringYear3Usd) : '—'],
      ['Total Contract Value', fmt(calc.totals.tcvUsd)]
    ];
    pricingRows.forEach(function (row, idx) {
      var isLast = idx === pricingRows.length - 1;
      var rowY = page1BoxY + 18 + idx * 8;
      text(doc, row[0], MARGIN + 8, rowY, {
        size: isLast ? 9 : 8.5,
        style: isLast ? 'bold' : 'normal',
        color: isLast ? C.tintDark : page1LabelColor
      });
      text(doc, row[1], PAGE_W - MARGIN - 8, rowY, {
        size: isLast ? 12 : 10,
        style: 'bold',
        color: isLast ? C.tintDark : page1ValueColor,
        align: 'right'
      });
    });

    // Footer
    text(doc, 'Generated ' + generatedAt, MARGIN, 265, { size: 8, color: C.medGray });
    if (partnerEmail) text(doc, 'Prepared by ' + partnerEmail, PAGE_W - MARGIN, 265, { size: 8, color: C.medGray, align: 'right' });
    pageFooter(doc, 1, totalPages, proposalId, portalDomain);

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
    var ctx = formatSectorLabel(draft.sector) + '  |  ' + (calc.input.companySegmentLabel || '—');
    text(doc, ctx, MARGIN, y, { size: 9, color: C.medGray });
    y += 10;

    // Table
    var cols = [
      { label: 'SKU',         x: MARGIN + 3,  w: 28,  align: 'left' },
      { label: 'Description', x: MARGIN + 31, w: 145, align: 'left' }
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
        pageFooter(doc, doc.internal.getNumberOfPages(), totalPages, proposalId, portalDomain);
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
      if (name.length > 110) name = name.slice(0, 109) + '…';
      var row = [l.code, name];
      row.forEach(function (cell, ci) {
        var col = cols[ci];
        var tx = col.align === 'right' ? col.x + col.w - 2 : col.x;
        var cellText = String(cell);
        text(doc, cellText, tx, y + 5.5, { size: 8.5, color: C.darkGray, align: col.align === 'right' ? 'right' : undefined });
      });
      doc.setDrawColor(C.border[0], C.border[1], C.border[2]);
      doc.line(tableLeft, y + rowH, tableRight, y + rowH);
      y += rowH;
    });

    y += 4;


    // Validity line — applies whether single-year or multi-year
    var issuedAt = new Date();
    var expiresAt = new Date(issuedAt.getTime());
    expiresAt.setUTCDate(expiresAt.getUTCDate() + 90);
    var issuedStr = issuedAt.toISOString().slice(0, 10);
    var expiresStr = expiresAt.toISOString().slice(0, 10);
    text(doc,
         'Pricing valid for 90 days from issue.  Issued ' + issuedStr + '  ·  Expires ' + expiresStr + '.',
         MARGIN, y + 3,
         { size: 8, style: 'italic', color: C.medGray });
    y += 8;

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

    pageFooter(doc, doc.internal.getNumberOfPages(), totalPages, proposalId, portalDomain);

    return { doc: doc, proposalId: proposalId };
  }

  // Fire the email send with the base64-encoded PDF attached.
  // Returns a Promise that resolves with { ok: true, resendId } or
  // { ok: false, code, error }. Never throws — caller can render either outcome.
  //
  // This function posts to the existing sendProposal Cloud Function contract:
  //   { to, company, contact, contactEmail, proposalId, useCase,
  //     annualRecurring, tcv, termYears, pdfBase64, pdfFilename, cc }
  // Authentication is via X-Portal-Secret header (shared-secret pattern).
  async function sendEmail(input, proposalId, pdfBase64, pdfFilename) {
    try {
      var cfg = window.TrendzactConfig || {};
      if (!cfg.portalSecret || cfg.portalSecret === 'REPLACE_ME_WITH_GENERATED_SECRET') {
        return { ok: false, code: 'NO_SECRET',
                 error: 'Portal shared secret not configured in portal-config.js.' };
      }
      var endpoint = cfg.sendProposalUrl || '/api/send-proposal';

      var draft = input.draft || {};
      var calc = input.calculation || {};
      var totals = calc.totals || {};

      var partnerEmail = (input.partnerEmail || '').trim();
      if (!partnerEmail) {
        return { ok: false, code: 'NO_PARTNER_EMAIL',
                 error: 'Partner email not available — email not sent.' };
      }

      // Parse the optional CC list. Accept comma or semicolon separators.
      var ccList = [];
      if (input.ccTo && input.ccTo.trim()) {
        ccList = input.ccTo.split(/[,;]/)
          .map(function (s) { return s.trim(); })
          .filter(function (s) { return s.length > 0; });
      }

      var payload = {
        to: partnerEmail,
        company: draft.companyName || '',
        contact: draft.contactName || '',
        contactEmail: draft.contactEmail || '',
        proposalId: proposalId,
        useCase: draft.primaryUseCase || '',
        annualRecurring: totals.recurringYear1Usd || totals.year1AnnualUsd || null,
        tcv: totals.tcvUsd || null,
        termYears: totals.contractYears || draft.contractYears || 1,
        pdfBase64: pdfBase64,
        pdfFilename: pdfFilename,
        cc: ccList
      };

      var resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Portal-Secret': cfg.portalSecret
        },
        body: JSON.stringify(payload)
      });
      var body = null;
      try { body = await resp.json(); } catch (e) { /* non-JSON response */ }
      if (!resp.ok) {
        return {
          ok: false,
          code: 'HTTP_' + resp.status,
          error: (body && (body.error || body.message)) || 'Email service returned ' + resp.status
        };
      }
      return { ok: true, resendId: body && body.resendId };
    } catch (e) {
      console.error('[ProposalRender] sendEmail threw:', e);
      return { ok: false, code: 'NETWORK_ERROR', error: e.message || String(e) };
    }
  }

  // render() — builds the PDF once, then:
  //   (1) triggers a local browser download (partner's immediate copy)
  //   (2) fires the email with the PDF attached as base64
  // Both happen from the same rendered PDF so the files are byte-identical.
  //
  // Returns:
  //   {
  //     proposalId: 'TZ-XXXXXXXX',
  //     filename: 'trendzact-proposal-...-TZ-XXXXXXXX.pdf',
  //     emailPromise: Promise<{ ok, code?, error?, resendId? }>
  //   }
  function render(input) {
    var built = buildPdf(input);
    var safeCo = (input.draft.companyName || 'prospect').replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 30);
    var filename = 'trendzact-proposal-' + safeCo + '-' + built.proposalId + '.pdf';

    // Get the PDF as a base64 string for the email attachment.
    // jsPDF's datauristring output returns "data:application/pdf;base64,<...>"
    // — strip the prefix so we send just the base64 payload.
    var dataUri = built.doc.output('datauristring');
    var commaIdx = dataUri.indexOf(',');
    var pdfBase64 = commaIdx >= 0 ? dataUri.substring(commaIdx + 1) : dataUri;

    // Trigger local download (partner gets immediate copy).
    built.doc.save(filename);

    // Fire the email in parallel — resolves with result object, never throws.
    var emailPromise = sendEmail(input, built.proposalId, pdfBase64, filename);

    return {
      proposalId: built.proposalId,
      filename: filename,
      emailPromise: emailPromise
    };
  }

  window.TrendzactProposalRender = { render: render };
})();
