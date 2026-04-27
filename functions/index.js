const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const { Resend } = require('resend');

admin.initializeApp();

const resendApiKey = defineSecret('RESEND_API_KEY');
const portalSecret = defineSecret('PORTAL_SHARED_SECRET');

const DEFAULT_BCC = ['partner-proposals@trendzact.com'];
const FROM = 'Trendzact Deal Desk <deal-desk@trendzact.com>';
const CONTACT_TO = ['deal-desk@trendzact.com'];

exports.sendProposal = onRequest(
  {
    cors: true,
    secrets: [resendApiKey, portalSecret],
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 60
  },
  async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!isAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const {
        to,
        company,
        contact,
        contactEmail,
        proposalId,
        useCase,
        annualRecurring,
        tcv,
        termYears,
        pdfBase64,
        pdfFilename,
        cc = [],
        bcc = DEFAULT_BCC
      } = req.body || {};

      if (!to || !pdfBase64 || !pdfFilename || !company) {
        return res.status(400).json({ error: 'Missing required fields: to, company, pdfBase64, pdfFilename' });
      }

      const ccList = normalizeRecipients(cc);
      let bccList = normalizeRecipients(bcc);
      if (!bccList.length) bccList = DEFAULT_BCC.slice();

      const resend = new Resend(resendApiKey.value());
      const partnerName = (to.split('@')[0] || 'there')
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        .split(' ')[0];

      const arr = annualRecurring ? '$' + Math.round(annualRecurring).toLocaleString('en-US') : '—';
      const tcvStr = tcv ? '$' + Math.round(tcv).toLocaleString('en-US') : null;
      const issuedAt = new Date();
      const expiresAt = new Date(issuedAt.getTime());
      expiresAt.setUTCDate(expiresAt.getUTCDate() + 90);
      const issuedStr = issuedAt.toISOString().slice(0, 10);
      const expiresStr = expiresAt.toISOString().slice(0, 10);
      const priceLabel = 'MSRP Price USD($)';
      const priceNote = 'Actual price based on distributor negotiated terms';

      const forwardLine = contact && contactEmail
        ? `Forward it to <strong>${escapeHtml(contact)}</strong> at <a href="mailto:${escapeHtml(contactEmail)}" style="color: #00827C;">${escapeHtml(contactEmail)}</a> when ready.`
        : contact
          ? `Forward it to <strong>${escapeHtml(contact)}</strong> when ready.`
          : 'Forward it to your prospect contact when ready.';

      const forwardLineText = contact && contactEmail
        ? `Forward it to ${contact} at ${contactEmail} when ready.`
        : contact
          ? `Forward it to ${contact} when ready.`
          : 'Forward it to your prospect contact when ready.';

      const emailResult = await resend.emails.send({
        from: FROM,
        to: [to],
        cc: ccList.length ? ccList : undefined,
        bcc: bccList,
        subject: `Trendzact GRC1 Proposal — ${company}`,
        text: buildProposalTextBody({
          partnerName,
          company,
          contact,
          proposalId,
          useCase,
          arr,
          tcvStr,
          termYears,
          forwardLineText,
          issuedStr,
          expiresStr,
          priceLabel,
          priceNote
        }),
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #353D4A; max-width: 560px;">
            <p>${escapeHtml(partnerName)},</p>
            <p>Your Trendzact GRC1 proposal for <strong>${escapeHtml(company)}</strong> is attached. ${forwardLine}</p>
            <div style="border: 2px solid #00827C; background: #F0FAF9; border-radius: 12px; padding: 14px 16px; margin: 18px 0;">
              <div style="font-size: 12px; color: #7A7F88; text-transform: uppercase; letter-spacing: .04em; font-weight: 700;">${escapeHtml(priceLabel)}</div>
              <div style="font-size: 26px; line-height: 1.2; color: #053F3B; font-weight: 800; margin-top: 4px;">${arr}</div>
              <div style="font-size: 13px; color: #353D4A; margin-top: 6px; font-weight: 700;">${escapeHtml(priceNote)}</div>
            </div>
            <table style="border-collapse: collapse; margin: 20px 0; font-size: 14px;">
              <tr><td style="color: #7A7F88; padding: 4px 12px 4px 0;">Prospect</td><td>${escapeHtml(company)}${contact ? ' · ' + escapeHtml(contact) : ''}</td></tr>
              <tr><td style="color: #7A7F88; padding: 4px 12px 4px 0;">Primary use case</td><td>${escapeHtml(useCase || '—')}</td></tr>
              <tr><td style="color: #7A7F88; padding: 4px 12px 4px 0;">${escapeHtml(priceLabel)}</td><td><strong>${arr}</strong></td></tr>
              <tr><td style="color: #7A7F88; padding: 4px 12px 4px 0;">Price note</td><td><strong>${escapeHtml(priceNote)}</strong></td></tr>
              ${tcvStr && termYears ? `<tr><td style="color: #7A7F88; padding: 4px 12px 4px 0;">MSRP TCV (${termYears}yr)</td><td><strong>${tcvStr}</strong></td></tr>` : ''}
              <tr><td style="color: #7A7F88; padding: 4px 12px 4px 0;">Proposal ID</td><td style="font-family: monospace;">${escapeHtml(proposalId || '—')}</td></tr>
            </table>
            <p style="font-size: 13px; color: #353D4A;">Questions about the proposal? Reply to this email to reach <a href="mailto:deal-desk@trendzact.com" style="color: #00827C;">deal-desk@trendzact.com</a>.</p>
            <hr style="border: none; border-top: 1px solid #EEF1F3; margin: 24px 0;" />
            <p style="font-size: 12px; color: #7A7F88; font-style: italic;">Pricing valid for 90 days from issue. Issued <span style="font-family: monospace; font-style: normal;">${issuedStr}</span>; expires <span style="font-family: monospace; font-style: normal;">${expiresStr}</span>. ${escapeHtml(priceNote)}.</p>
          </div>
        `,
        attachments: [{ filename: pdfFilename, content: pdfBase64 }]
      });

      await admin.firestore().collection('proposals_sent').add({
        proposalId: proposalId || null,
        company,
        contact: contact || null,
        contactEmail: contactEmail || null,
        to,
        cc: ccList,
        bcc: bccList,
        useCase: useCase || null,
        annualRecurring: annualRecurring || null,
        tcv: tcv || null,
        termYears: termYears || null,
        priceLabel,
        priceNote,
        resendId: emailResult.data?.id || null,
        sentAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return res.status(200).json({ ok: true, proposalId, resendId: emailResult.data?.id });
    } catch (err) {
      console.error('sendProposal error:', err);
      return res.status(500).json({ error: 'Failed to send proposal', message: err.message });
    }
  }
);

exports.sendContact = onRequest(
  {
    cors: true,
    secrets: [resendApiKey, portalSecret],
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 30
  },
  async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!isAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const {
        name,
        company,
        email,
        routeTo,
        subject,
        message,
        pageUrl,
        userAgent
      } = req.body || {};

      if (!name || !company || !email || !routeTo || !subject || !message) {
        return res.status(400).json({ error: 'Missing required fields: name, company, email, routeTo, subject, message' });
      }

      const cleanEmail = extractEmailAddress(email);
      if (!isLikelyEmail(cleanEmail)) return res.status(400).json({ error: 'Invalid email address' });

      const emailSubject = `${String(routeTo).trim()}: ${String(subject).trim()}`;
      const resend = new Resend(resendApiKey.value());

      const text = buildContactTextBody({ name, company, email: cleanEmail, routeTo, subject, message, pageUrl, userAgent });
      const html = buildContactHtmlBody({ name, company, email: cleanEmail, routeTo, subject, message, pageUrl, userAgent });

      const emailResult = await resend.emails.send({
        from: FROM,
        to: CONTACT_TO,
        replyTo: cleanEmail,
        subject: emailSubject,
        text,
        html
      });

      await admin.firestore().collection('contact_messages').add({
        name,
        company,
        email: cleanEmail,
        routeTo,
        subject,
        emailSubject,
        message,
        pageUrl: pageUrl || null,
        userAgent: userAgent || null,
        to: CONTACT_TO,
        resendId: emailResult.data?.id || null,
        sentAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return res.status(200).json({ ok: true, resendId: emailResult.data?.id });
    } catch (err) {
      console.error('sendContact error:', err);
      return res.status(500).json({ error: 'Failed to send message', message: err.message });
    }
  }
);

function isAuthorized(req) {
  const providedSecret = req.headers['x-portal-secret'];
  return !!providedSecret && providedSecret === portalSecret.value();
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function nl2br(s) {
  return escapeHtml(s).replace(/\n/g, '<br />');
}

function buildProposalTextBody(ctx) {
  const lines = [];
  lines.push(`${ctx.partnerName},`);
  lines.push('');
  lines.push(`Your Trendzact GRC1 proposal for ${ctx.company} is attached. ${ctx.forwardLineText}`);
  lines.push('');
  lines.push(`${ctx.priceLabel}: ${ctx.arr}`);
  lines.push(`Price note: ${ctx.priceNote}`);
  lines.push('');
  lines.push(`Prospect:           ${ctx.company}${ctx.contact ? ' · ' + ctx.contact : ''}`);
  lines.push(`Primary use case:   ${ctx.useCase || '—'}`);
  if (ctx.tcvStr && ctx.termYears) lines.push(`MSRP TCV (${ctx.termYears}yr): ${ctx.tcvStr}`);
  lines.push(`Proposal ID:        ${ctx.proposalId || '—'}`);
  lines.push('');
  lines.push('Questions about the proposal? Reply to this email to reach deal-desk@trendzact.com.');
  lines.push('');
  lines.push('---');
  lines.push(`Pricing valid for 90 days from issue. Issued ${ctx.issuedStr}; expires ${ctx.expiresStr}. ${ctx.priceNote}.`);
  return lines.join('\n');
}

function buildContactTextBody(ctx) {
  return [
    `Route To: ${ctx.routeTo}`,
    `Subject: ${ctx.subject}`,
    '',
    `Name: ${ctx.name}`,
    `Company: ${ctx.company}`,
    `Email: ${ctx.email}`,
    '',
    'Message:',
    ctx.message,
    '',
    'Context:',
    `Page: ${ctx.pageUrl || '—'}`,
    `User Agent: ${ctx.userAgent || '—'}`
  ].join('\n');
}

function buildContactHtmlBody(ctx) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #353D4A; max-width: 640px;">
      <h2 style="margin: 0 0 12px; color: #353D4A;">Partner Contact Request</h2>
      <table style="border-collapse: collapse; margin: 16px 0; font-size: 14px;">
        <tr><td style="color: #7A7F88; padding: 4px 16px 4px 0;">Route To</td><td><strong>${escapeHtml(ctx.routeTo)}</strong></td></tr>
        <tr><td style="color: #7A7F88; padding: 4px 16px 4px 0;">Subject</td><td>${escapeHtml(ctx.subject)}</td></tr>
        <tr><td style="color: #7A7F88; padding: 4px 16px 4px 0;">Name</td><td>${escapeHtml(ctx.name)}</td></tr>
        <tr><td style="color: #7A7F88; padding: 4px 16px 4px 0;">Company</td><td>${escapeHtml(ctx.company)}</td></tr>
        <tr><td style="color: #7A7F88; padding: 4px 16px 4px 0;">Email</td><td><a href="mailto:${escapeHtml(ctx.email)}" style="color: #00827C;">${escapeHtml(ctx.email)}</a></td></tr>
      </table>
      <div style="background: #F0FAF9; border-left: 3px solid #00A398; padding: 14px 16px; margin: 18px 0; line-height: 1.5;">
        ${nl2br(ctx.message)}
      </div>
      <p style="font-size: 12px; color: #7A7F88;">Page: ${escapeHtml(ctx.pageUrl || '—')}</p>
    </div>
  `;
}

function normalizeRecipients(value) {
  if (!value) return [];
  const list = Array.isArray(value) ? value : [value];
  return list
    .flatMap(v => String(v).split(/[;,]/))
    .map(s => s.trim())
    .filter(Boolean)
    .map(extractEmailAddress)
    .filter(isLikelyEmail);
}

function extractEmailAddress(input) {
  const m = String(input).match(/<([^>]+)>/);
  return (m ? m[1] : input).trim();
}

function isLikelyEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s));
}
