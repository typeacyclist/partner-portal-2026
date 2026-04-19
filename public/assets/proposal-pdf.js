// Trendzact Partners — Proposal PDF Generator
// Uses jsPDF (loaded via CDN) to build a properly formatted, selectable-text PDF.

(function () {
  // Brand palette
  const C = {
    darkGray: [53, 61, 74],
    medGray: [122, 127, 136],
    darkGreen: [0, 130, 124],
    medGreen: [0, 163, 152],
    tintDark: [224, 244, 243],
    tintLight: [240, 250, 249],
    border: [229, 231, 235],
    white: [255, 255, 255]
  };

  const PAGE_W = 210;  // A4 width in mm
  const PAGE_H = 297;  // A4 height in mm
  const MARGIN = 16;
  const CONTENT_W = PAGE_W - MARGIN * 2;

  // ---- helpers ----
  function fillRect(doc, x, y, w, h, color) {
    doc.setFillColor(...color);
    doc.rect(x, y, w, h, 'F');
  }

  function hr(doc, y, color = C.border) {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  }

  function text(doc, str, x, y, opts = {}) {
    doc.setFont(opts.font || 'helvetica', opts.style || 'normal');
    doc.setFontSize(opts.size || 10);
    doc.setTextColor(...(opts.color || C.darkGray));
    doc.text(str || '', x, y, opts.align ? { align: opts.align } : undefined);
  }

  function money(n) {
    if (n == null || isNaN(n)) return '—';
    return '$' + Math.round(n).toLocaleString('en-US');
  }

  function pageFooter(doc, pageNum, totalPages) {
    text(doc, 'Trendzact GRC1 — Partner Proposal', MARGIN, PAGE_H - 8, {
      size: 8, color: C.medGray
    });
    text(doc, `Page ${pageNum} of ${totalPages}`, PAGE_W - MARGIN, PAGE_H - 8, {
      size: 8, color: C.medGray, align: 'right'
    });
    text(doc, 'Confidential — For partner and named prospect use only.', PAGE_W / 2, PAGE_H - 8, {
      size: 8, color: C.medGray, align: 'center'
    });
  }

  // ---- collect form data from the page ----
  function collectData() {
    const val = id => (document.getElementById(id)?.value || '').trim();
    const checked = id => document.getElementById(id)?.checked || false;

    const serviceRadio = document.querySelector('input[name="service"]:checked');
    const serviceMap = {
      self: 'Self-Operated',
      essentials: 'Managed IRM Essentials',
      twentyfour: 'Managed IRM 24×7',
      investigations: 'Managed Investigations'
    };
    const serviceKey = serviceRadio?.value || 'self';

    // same price table as app.js
    const prices = { core: 12, swa: 8, sia: 9, msr: 7, dlp: 11, itm: 10, svm: 6 };
    const serviceAdders = { self: 0, essentials: 4, twentyfour: 8, investigations: 12 };

    const modules = [
      { id: 'modCore', name: 'GRC1 Core (required foundation)', unit: prices.core, on: checked('modCore') },
      { id: 'modSWA', name: 'Secure Workspaces Anywhere', unit: prices.swa, on: checked('modSWA') },
      { id: 'modSIA', name: 'Session Identity Assurance', unit: prices.sia, on: checked('modSIA') },
      { id: 'modMSR', name: 'Multi-Screen Recording', unit: prices.msr, on: checked('modMSR') },
      { id: 'modDLP', name: 'Edge DLP', unit: prices.dlp, on: checked('modDLP') },
      { id: 'modITM', name: 'Insider Threat Management', unit: prices.itm, on: checked('modITM') },
      { id: 'modSVM', name: 'Secure Virtual Meetings', unit: prices.svm, on: checked('modSVM') }
    ];

    const users = parseInt(val('estUsers'), 10) || 0;
    const selected = modules.filter(m => m.on);
    const serviceUnit = serviceAdders[serviceKey] || 0;

    let perUser = selected.reduce((a, m) => a + m.unit, 0) + serviceUnit;
    const monthly = perUser * users;
    const annual = monthly * 12;

    return {
      company: val('company') || 'Prospect Company',
      contact: val('contact') || '',
      usecase: val('usecase') || '',
      stage: val('stage') || '',
      close: val('close') || '',
      arr: val('arr') || '',
      users,
      selected,
      service: serviceMap[serviceKey],
      serviceUnit,
      notes: val('notes'),
      perUser,
      monthly,
      annual,
      proposalId: 'TZ-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000),
      generatedAt: new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      })
    };
  }

  // ---- build the PDF ----
  function buildPDF(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    // ============ PAGE 1 — COVER ============
    // Top band
    fillRect(doc, 0, 0, PAGE_W, 52, C.darkGray);
    fillRect(doc, 0, 52, PAGE_W, 2, C.darkGreen);

    // Brand mark
    fillRect(doc, MARGIN, 16, 10, 10, C.darkGreen);
    doc.setDrawColor(...C.white);
    doc.setLineWidth(0.6);
    doc.line(MARGIN + 2, 19, MARGIN + 8, 19);
    doc.line(MARGIN + 5, 19, MARGIN + 5, 25);

    text(doc, 'Trendzact', MARGIN + 14, 21, {
      size: 14, style: 'bold', color: C.white
    });
    text(doc, 'PARTNERS', MARGIN + 14, 25.5, {
      size: 7, color: [180, 220, 218]
    });

    // Doc label top-right
    text(doc, 'PROPOSAL', PAGE_W - MARGIN, 21, {
      size: 10, style: 'bold', color: C.white, align: 'right'
    });
    text(doc, data.proposalId, PAGE_W - MARGIN, 25.5, {
      size: 8, color: [180, 220, 218], align: 'right'
    });

    // Cover content
    text(doc, 'Prepared for', MARGIN, 72, {
      size: 9, color: C.medGray
    });
    text(doc, data.company, MARGIN, 82, {
      size: 24, style: 'bold', color: C.darkGray
    });

    if (data.contact) {
      text(doc, 'Primary contact: ' + data.contact, MARGIN, 90, {
        size: 10, color: C.medGray
      });
    }

    // Key details block
    let yKd = 110;
    fillRect(doc, MARGIN, yKd, CONTENT_W, 44, C.tintLight);
    doc.setDrawColor(...C.medGreen);
    doc.setLineWidth(0.4);
    doc.line(MARGIN, yKd, MARGIN, yKd + 44);

    const kv = [
      ['Primary Use Case', data.usecase || '—'],
      ['Deal Stage', data.stage || '—'],
      ['Estimated Close', data.close || '—'],
      ['Estimated Users', data.users ? data.users.toLocaleString('en-US') : '—']
    ];
    kv.forEach((row, i) => {
      const col = i % 2;
      const r = Math.floor(i / 2);
      const cx = MARGIN + 6 + col * (CONTENT_W / 2);
      const cy = yKd + 10 + r * 18;
      text(doc, row[0].toUpperCase(), cx, cy, { size: 7, color: C.medGray });
      text(doc, row[1], cx, cy + 6, { size: 11, style: 'bold', color: C.darkGray });
    });

    // Proposal summary paragraph
    const intro = 'This proposal outlines a Trendzact GRC1 deployment scoped to ' +
      data.company + '\'s priority use case and risk profile. Indicative pricing ' +
      'is included for planning purposes. Final pricing, terms, and deployment ' +
      'scope are subject to Trendzact Deal Desk approval.';
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...C.darkGray);
    const introLines = doc.splitTextToSize(intro, CONTENT_W);
    doc.text(introLines, MARGIN, 168);

    // Indicative ARR hero
    fillRect(doc, MARGIN, 200, CONTENT_W, 44, C.darkGray);
    text(doc, 'INDICATIVE ANNUAL RECURRING', MARGIN + 8, 212, {
      size: 8, color: [200, 200, 210]
    });
    text(doc, money(data.annual), MARGIN + 8, 232, {
      size: 28, style: 'bold', color: C.white
    });
    text(doc, money(data.monthly) + ' / month   ·   ' + money(data.perUser) + ' / user / mo',
      PAGE_W - MARGIN - 8, 232, {
        size: 10, color: [180, 220, 218], align: 'right'
      });

    // Cover footer
    text(doc, 'Generated ' + data.generatedAt, MARGIN, 265, {
      size: 8, color: C.medGray
    });
    text(doc, 'Prepared by Trendzact Partner', PAGE_W - MARGIN, 265, {
      size: 8, color: C.medGray, align: 'right'
    });

    pageFooter(doc, 1, 3);

    // ============ PAGE 2 — SCOPE & PRICING ============
    doc.addPage();

    // Header band
    fillRect(doc, 0, 0, PAGE_W, 14, C.tintLight);
    text(doc, 'Scope & Indicative Pricing', MARGIN, 9.5, {
      size: 11, style: 'bold', color: C.darkGray
    });
    text(doc, data.proposalId, PAGE_W - MARGIN, 9.5, {
      size: 8, color: C.medGray, align: 'right'
    });

    let y = 30;
    text(doc, 'PACKAGING', MARGIN, y, { size: 8, color: C.medGreen });
    y += 2;
    fillRect(doc, MARGIN, y, 30, 0.8, C.medGreen);
    y += 10;

    text(doc, 'Modules selected for ' + data.company, MARGIN, y, {
      size: 14, style: 'bold', color: C.darkGray
    });
    y += 10;

    // ---- Hand-drawn pricing table (no plugin dependency) ----
    // Column layout (x-positions in mm, measured from page left edge)
    const cols = [
      { label: 'Line item', x: MARGIN + 3,               w: 82,  align: 'left'  },
      { label: 'Qty',       x: MARGIN + 85,              w: 20,  align: 'right' },
      { label: 'Unit / mo', x: MARGIN + 105,             w: 22,  align: 'right' },
      { label: 'Monthly',   x: MARGIN + 127,             w: 24,  align: 'right' },
      { label: 'Annual',    x: MARGIN + 151,             w: 27,  align: 'right' }
    ];
    const tableLeft = MARGIN;
    const tableRight = PAGE_W - MARGIN;
    const tableWidth = tableRight - tableLeft;
    const rowH = 9;
    const headerH = 10;

    // Header row
    fillRect(doc, tableLeft, y, tableWidth, headerH, C.tintLight);
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.2);
    doc.line(tableLeft, y + headerH, tableRight, y + headerH);
    cols.forEach(col => {
      const tx = col.align === 'right' ? col.x + col.w - 2 : col.x;
      text(doc, col.label, tx, y + 6.5, {
        size: 8, style: 'bold', color: C.darkGray,
        align: col.align === 'right' ? 'right' : undefined
      });
    });
    y += headerH;

    // Build body rows
    const rows = data.selected.map(m => ([
      m.name,
      data.users ? data.users.toLocaleString('en-US') : '—',
      '$' + m.unit.toFixed(2),
      money(m.unit * data.users),
      money(m.unit * data.users * 12)
    ]));

    // Service row
    if (data.serviceUnit > 0) {
      rows.push([
        data.service + ' (managed service)',
        data.users ? data.users.toLocaleString('en-US') : '—',
        '$' + data.serviceUnit.toFixed(2),
        money(data.serviceUnit * data.users),
        money(data.serviceUnit * data.users * 12)
      ]);
    } else {
      rows.push([data.service, '—', '—', '—', 'Included']);
    }

    // Draw body rows with zebra striping
    rows.forEach((row, i) => {
      if (i % 2 === 1) fillRect(doc, tableLeft, y, tableWidth, rowH, [250, 250, 251]);
      row.forEach((cell, ci) => {
        const col = cols[ci];
        const tx = col.align === 'right' ? col.x + col.w - 2 : col.x;
        // Truncate line-item name if too long
        let cellText = String(cell);
        if (ci === 0) {
          const maxChars = 44;
          if (cellText.length > maxChars) cellText = cellText.slice(0, maxChars - 1) + '…';
        }
        text(doc, cellText, tx, y + 6, {
          size: 9, color: C.darkGray,
          align: col.align === 'right' ? 'right' : undefined
        });
      });
      doc.setDrawColor(...C.border);
      doc.setLineWidth(0.15);
      doc.line(tableLeft, y + rowH, tableRight, y + rowH);
      y += rowH;
    });

    // Totals row
    fillRect(doc, tableLeft, y, tableWidth, rowH + 2, C.tintLight);
    doc.setDrawColor(...C.medGreen);
    doc.setLineWidth(0.4);
    doc.line(tableLeft, y, tableRight, y);
    text(doc, 'Indicative Annual Recurring',
      cols[3].x + cols[3].w - 2, y + 7,
      { size: 10, style: 'bold', color: C.darkGray, align: 'right' });
    text(doc, money(data.annual),
      cols[4].x + cols[4].w - 2, y + 7,
      { size: 11, style: 'bold', color: C.darkGreen, align: 'right' });
    y += rowH + 2;
    y += 14;

    // Managed service callout
    if (data.service) {
      text(doc, 'SERVICE MODEL', MARGIN, y, { size: 8, color: C.medGreen });
      y += 6;
      text(doc, data.service, MARGIN, y, { size: 12, style: 'bold', color: C.darkGray });
      y += 10;
    }

    // Notes
    if (data.notes) {
      text(doc, 'PROPOSAL NOTES', MARGIN, y, { size: 8, color: C.medGreen });
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...C.darkGray);
      const notesLines = doc.splitTextToSize(data.notes, CONTENT_W);
      doc.text(notesLines, MARGIN, y);
      y += notesLines.length * 4.5 + 8;
    }

    // Disclaimer
    y = Math.max(y, 240);
    fillRect(doc, MARGIN, y, CONTENT_W, 30, C.tintLight);
    text(doc, 'Disclaimer', MARGIN + 5, y + 8, {
      size: 9, style: 'bold', color: C.darkGray
    });
    const disc = 'Pricing shown is indicative and based on information provided at ' +
      'the time of generation. Final pricing is subject to Trendzact Deal Desk ' +
      'review, volume tier approval, deployment scope, and executed reseller ' +
      'terms. This document is confidential and intended only for the named ' +
      'partner and prospect.';
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...C.medGray);
    const dLines = doc.splitTextToSize(disc, CONTENT_W - 10);
    doc.text(dLines, MARGIN + 5, y + 14);

    pageFooter(doc, 2, 3);

    // ============ PAGE 3 — NEXT STEPS ============
    doc.addPage();

    fillRect(doc, 0, 0, PAGE_W, 14, C.tintLight);
    text(doc, 'Next Steps', MARGIN, 9.5, {
      size: 11, style: 'bold', color: C.darkGray
    });
    text(doc, data.proposalId, PAGE_W - MARGIN, 9.5, {
      size: 8, color: C.medGray, align: 'right'
    });

    y = 30;
    text(doc, 'NEXT STEP', MARGIN, y, { size: 8, color: C.darkGreen, style: 'bold' });
    y += 10;
    text(doc, 'How we move forward', MARGIN, y, {
      size: 18, style: 'bold', color: C.darkGray
    });
    y += 14;

    const steps = [
      ['01', 'Technical evaluation', 'SE-led session mapping the selected modules to your highest-priority risk scenarios. Demo delivered in your environment or via Trendzact tenant.'],
      ['02', 'Business case alignment', 'Workshop on audit readiness, incident reduction, and operating cost impact. Aligns scope to your budget and timing.'],
      ['03', 'Deal desk approval', 'Trendzact Deal Desk reviews final pricing, deployment terms, and packaging. Target turnaround: 2 business days.'],
      ['04', 'Order & provisioning', 'Sales order submitted by partner. Tenant provisioned and kickoff scheduled with Customer Success.']
    ];

    steps.forEach(([num, title, body]) => {
      // num badge
      fillRect(doc, MARGIN, y - 4, 10, 10, C.darkGreen);
      text(doc, num, MARGIN + 5, y + 2.5, {
        size: 9, style: 'bold', color: C.white, align: 'center'
      });
      // title + body
      text(doc, title, MARGIN + 14, y, {
        size: 11, style: 'bold', color: C.darkGray
      });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...C.medGray);
      const bLines = doc.splitTextToSize(body, CONTENT_W - 16);
      doc.text(bLines, MARGIN + 14, y + 5);
      y += 8 + bLines.length * 4.5 + 6;
    });

    // Contact block
    y += 8;
    fillRect(doc, MARGIN, y, CONTENT_W, 38, C.darkGray);
    text(doc, 'Questions?', MARGIN + 8, y + 12, {
      size: 13, style: 'bold', color: C.white
    });
    text(doc, 'Partner Deal Desk', MARGIN + 8, y + 20, {
      size: 9, color: [180, 220, 218]
    });
    text(doc, 'deal-desk@trendzact.com', MARGIN + 8, y + 26, {
      size: 11, style: 'bold', color: C.white
    });
    text(doc, 'Response within 1 business day', MARGIN + 8, y + 32, {
      size: 8, color: [180, 220, 218]
    });

    pageFooter(doc, 3, 3);

    return doc;
  }

  // ---- public API ----
  window.TrendzactProposal = {
    download() {
      const data = collectData();
      const doc = buildPDF(data);
      const safe = data.company.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      doc.save(`trendzact-proposal-${safe}-${data.proposalId}.pdf`);
      return data.proposalId;
    },

    async blob() {
      const data = collectData();
      const doc = buildPDF(data);
      return { blob: doc.output('blob'), data };
    },

    async emailViaMailto() {
      const data = collectData();
      const doc = buildPDF(data);
      const safe = data.company.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      const filename = `trendzact-proposal-${safe}-${data.proposalId}.pdf`;
      // Auto-download so partner has the attachment
      doc.save(filename);
      // Then open email draft
      const subject = encodeURIComponent(`Trendzact GRC1 Proposal — ${data.company}`);
      const body = encodeURIComponent(
        `Hi${data.contact ? ' ' + data.contact.split(' ')[0] : ''},\n\n` +
        `Please find attached the Trendzact GRC1 proposal for ${data.company}.\n\n` +
        `Summary:\n` +
        `  • Primary use case: ${data.usecase || '—'}\n` +
        `  • Estimated users: ${data.users || '—'}\n` +
        `  • Indicative annual recurring: ${money(data.annual)}\n\n` +
        `The PDF has been saved to your Downloads folder — please attach it before sending.\n\n` +
        `Happy to walk through any section on a call.\n\n` +
        `Best regards,\n` +
        `Trendzact Partner Team\n` +
        `Proposal ID: ${data.proposalId}`
      );
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
      return data.proposalId;
    },

    async emailViaBackend(endpoint, recipientEmail) {
      // Phase-2 path: POST base64 PDF to a backend endpoint that sends the email.
      // Backend handles: SendGrid/Resend API, attaching PDF, CC'ing deal desk, logging.
      const data = collectData();
      const doc = buildPDF(data);
      const base64 = doc.output('datauristring').split(',')[1];
      const payload = {
        to: recipientEmail,
        company: data.company,
        contact: data.contact,
        proposalId: data.proposalId,
        useCase: data.usecase,
        annualRecurring: data.annual,
        pdfBase64: base64,
        pdfFilename: `trendzact-proposal-${data.proposalId}.pdf`
      };

      // Shared-secret header (KISS protection, matches functions/index.js check)
      const headers = { 'Content-Type': 'application/json' };
      const cfg = window.PORTAL_CONFIG;
      if (cfg && cfg.sharedSecret) {
        headers['X-Portal-Secret'] = cfg.sharedSecret;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Email send failed: ' + res.status);
      return await res.json();
    }
  };
})();
