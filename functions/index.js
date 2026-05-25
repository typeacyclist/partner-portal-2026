const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const crypto = require('crypto');
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

        const emailResult = await resend.emails.send({
          from: FROM,
          to: [to],
          cc: ccList.length ? ccList : undefined,
          bcc: bccList,
          subject: `Trendzact GRC1 Proposal — ${company} ${proposalId || ''}`.trim(),
          text: buildProposalTextBody({ company, proposalId }),
          html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #353D4A; max-width: 560px;">
            <p>Your Trendzact GRC1 proposal for <strong>${escapeHtml(company)}</strong> <span style="font-family: monospace; color: #7A7F88;">${escapeHtml(proposalId || '')}</span> is attached.</p>
            <p>Please contact the Trendzact Deal Desk with any questions.</p>
            <p style="margin-top: 24px; font-weight: 600;">Trendzact Deal Desk<br /><a href="mailto:deal-desk@trendzact.com" style="color: #00827C; font-weight: 400;">deal-desk@trendzact.com</a></p>
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
  if (!providedSecret) return false;
  const provided = Buffer.from(String(providedSecret));
  const expected = Buffer.from(portalSecret.value());
  if (provided.length !== expected.length) return false;
  return crypto.timingSafeEqual(provided, expected);
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
  lines.push(`Your Trendzact GRC1 proposal for ${ctx.company} ${ctx.proposalId || ''} is attached.`.trim());
  lines.push('');
  lines.push('Please contact the Trendzact Deal Desk with any questions.');
  lines.push('');
  lines.push('Trendzact Deal Desk');
  lines.push('deal-desk@trendzact.com');
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