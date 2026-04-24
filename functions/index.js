/**
 * Trendzact Partners — Email Proposal Function
 *
 * Receives a base64-encoded PDF from the Proposal Builder and emails it
 * via Resend. The email goes TO the partner who built the proposal, so they
 * have a permanent record with the PDF attached. BCC to partner-proposals@
 * for internal pipeline tracking.
 *
 * Expected POST body:
 * {
 *   to: "partner@partnerco.com",     // the authenticated partner
 *   company: "Acme Corp",            // the prospect
 *   contact: "Jane Doe",             // the prospect contact
 *   contactEmail: "jane@acme.com",   // the prospect contact email (for forward guidance)
 *   proposalId: "TZ-XXXXXXXX",
 *   useCase: "Insider Threat Detection",
 *   annualRecurring: 199000,         // Y1 total for the hero line
 *   tcv: 532450,                     // optional — shown in detail row
 *   termYears: 3,                    // optional — shown in detail row
 *   pdfBase64: "<base64 string>",
 *   pdfFilename: "trendzact-proposal-TZ-XXXXXXXX.pdf",
 *   cc: ["colleague@partnerco.com"]  // optional — partner's CC-To list
 * }
 *
 * Required header:
 *   X-Portal-Secret: <the PORTAL_SHARED_SECRET value>
 */

const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const { Resend } = require('resend');

admin.initializeApp();

// Set with: firebase functions:secrets:set RESEND_API_KEY
const resendApiKey = defineSecret('RESEND_API_KEY');

// Set with: firebase functions:secrets:set PORTAL_SHARED_SECRET
// Generate a random value once and give it to the frontend build.
// This is lightweight protection — not real auth. Rotate when partners start
// actually using the portal and replace with Firebase Auth ID token verification.
const portalSecret = defineSecret('PORTAL_SHARED_SECRET');

// Internal pipeline tracking — partner doesn't see this in the email
const DEFAULT_BCC = 'Partner Proposals <partner-proposals@trendzact.com>';

// The "from" address must be on a domain you've verified in Resend
const FROM = 'Trendzact Deal Desk <deal-desk@trendzact.com>';

exports.sendProposal = onRequest(
  {
    cors: true,
    secrets: [resendApiKey, portalSecret],
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 60
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // ---- Shared secret check (KISS protection, NOT real auth) ----
    const providedSecret = req.headers['x-portal-secret'];
    if (!providedSecret || providedSecret !== portalSecret.value()) {
      console.warn('sendProposal: rejected request with missing/wrong shared secret');
      return res.status(401).json({ error: 'Unauthorized' });
    }

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

      // Minimal validation
      if (!to || !pdfBase64 || !pdfFilename || !company) {
        return res.status(400).json({
          error: 'Missing required fields: to, company, pdfBase64, pdfFilename'
        });
      }

      const resend = new Resend(resendApiKey.value());

      // Partner's first name for salutation (fall back to "there" if no name)
      // Partner's name comes from their auth account, but we don't have it in
      // the current payload shape. Use the part before @ in their email as a
      // reasonable heuristic until we add partnerName to the payload.
      const partnerName = (to.split('@')[0] || 'there')
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        .split(' ')[0];

      const arr = annualRecurring
        ? '$' + Math.round(annualRecurring).toLocaleString('en-US')
        : '—';
      const tcvStr = tcv
        ? '$' + Math.round(tcv).toLocaleString('en-US')
        : null;

      // Forward-guidance line: include prospect contact email if provided
      const forwardLine = contact && contactEmail
        ? `Forward it to <strong>${escapeHtml(contact)}</strong> at <a href="mailto:${escapeHtml(contactEmail)}" style="color: #00827C;">${escapeHtml(contactEmail)}</a> when ready.`
        : contact
          ? `Forward it to <strong>${escapeHtml(contact)}</strong> when ready.`
          : `Forward it to your prospect contact when ready.`;

      const forwardLineText = contact && contactEmail
        ? `Forward it to ${contact} at ${contactEmail} when ready.`
        : contact
          ? `Forward it to ${contact} when ready.`
          : `Forward it to your prospect contact when ready.`;

      // Issue / expiry dates for pricing validity
      const issuedAt = new Date();
      const expiresAt = new Date(issuedAt.getTime());
      expiresAt.setUTCDate(expiresAt.getUTCDate() + 90);
      const issuedStr = issuedAt.toISOString().slice(0, 10);
      const expiresStr = expiresAt.toISOString().slice(0, 10);

      const emailResult = await resend.emails.send({
        from: FROM,
        to: [to],
        cc: cc.length ? cc : undefined,
        bcc: bcc,
        subject: `Trendzact GRC1 Proposal — ${company}`,
        text: buildTextBody({
          partnerName, company, contact, contactEmail, proposalId,
          useCase, arr, tcvStr, termYears, forwardLineText,
          issuedStr, expiresStr
        }),
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #353D4A; max-width: 560px;">
            <p>${escapeHtml(partnerName)},</p>
            <p>Your Trendzact GRC1 proposal for <strong>${escapeHtml(company)}</strong> is attached. ${forwardLine}</p>
            <table style="border-collapse: collapse; margin: 20px 0; font-size: 14px;">
              <tr><td style="color: #7A7F88; padding: 4px 12px 4px 0;">Prospect</td><td>${escapeHtml(company)}${contact ? ' · ' + escapeHtml(contact) : ''}</td></tr>
              <tr><td style="color: #7A7F88; padding: 4px 12px 4px 0;">Primary use case</td><td>${escapeHtml(useCase || '—')}</td></tr>
              <tr><td style="color: #7A7F88; padding: 4px 12px 4px 0;">Year 1 recurring</td><td><strong>${arr}</strong></td></tr>
              ${tcvStr && termYears ? `<tr><td style="color: #7A7F88; padding: 4px 12px 4px 0;">TCV (${termYears}yr)</td><td><strong>${tcvStr}</strong></td></tr>` : ''}
              <tr><td style="color: #7A7F88; padding: 4px 12px 4px 0;">Proposal ID</td><td style="font-family: monospace;">${escapeHtml(proposalId || '—')}</td></tr>
            </table>
            <p style="font-size: 13px; color: #353D4A;">Questions about the proposal? Reply to this email to reach <a href="mailto:deal-desk@trendzact.com" style="color: #00827C;">deal-desk@trendzact.com</a>.</p>
            <hr style="border: none; border-top: 1px solid #EEF1F3; margin: 24px 0;" />
            <p style="font-size: 12px; color: #7A7F88; font-style: italic;">
              Pricing valid for 90 days from issue. Issued <span style="font-family: monospace; font-style: normal;">${issuedStr}</span>; expires <span style="font-family: monospace; font-style: normal;">${expiresStr}</span>.
            </p>
            <p style="font-size: 11px; color: #7A7F88;">
              This document is confidential and intended only for the named recipient. Pricing shown is indicative and subject to Trendzact Deal Desk approval.
            </p>
          </div>
        `,
        attachments: [
          {
            filename: pdfFilename,
            content: pdfBase64  // Resend accepts base64 strings directly
          }
        ]
      });

      // Audit log
      await admin.firestore().collection('proposals_sent').add({
        proposalId: proposalId || null,
        company,
        contact: contact || null,
        contactEmail: contactEmail || null,
        to,
        cc,
        bcc,
        useCase: useCase || null,
        annualRecurring: annualRecurring || null,
        tcv: tcv || null,
        termYears: termYears || null,
        resendId: emailResult.data?.id || null,
        sentAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return res.status(200).json({
        ok: true,
        proposalId,
        resendId: emailResult.data?.id
      });
    } catch (err) {
      console.error('sendProposal error:', err);
      return res.status(500).json({
        error: 'Failed to send proposal',
        message: err.message
      });
    }
  }
);

// ========================================================================
// Helpers
// ========================================================================

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildTextBody(ctx) {
  const lines = [];
  lines.push(`${ctx.partnerName},`);
  lines.push('');
  lines.push(`Your Trendzact GRC1 proposal for ${ctx.company} is attached. ${ctx.forwardLineText}`);
  lines.push('');
  lines.push(`Prospect:           ${ctx.company}${ctx.contact ? ' · ' + ctx.contact : ''}`);
  lines.push(`Primary use case:   ${ctx.useCase || '—'}`);
  lines.push(`Year 1 recurring:   ${ctx.arr}`);
  if (ctx.tcvStr && ctx.termYears) {
    lines.push(`TCV (${ctx.termYears}yr):          ${ctx.tcvStr}`);
  }
  lines.push(`Proposal ID:        ${ctx.proposalId || '—'}`);
  lines.push('');
  lines.push(`Questions about the proposal? Reply to this email to reach deal-desk@trendzact.com.`);
  lines.push('');
  lines.push(`---`);
  lines.push(`Pricing valid for 90 days from issue. Issued ${ctx.issuedStr}; expires ${ctx.expiresStr}.`);
  lines.push(`This document is confidential and intended only for the named recipient. Pricing shown is indicative and subject to Trendzact Deal Desk approval.`);
  return lines.join('\n');
}
