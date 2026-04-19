/**
 * Trendzact Partners — Email Proposal Function
 *
 * Receives a base64-encoded PDF from the Proposal Builder and emails it
 * via Resend. CC's the deal desk. Logs every send to Firestore for audit.
 *
 * Expected POST body:
 * {
 *   to: "contact@prospect.com",
 *   company: "Acme Corp",
 *   contact: "Jane Doe",
 *   proposalId: "TZ-2026-123456",
 *   useCase: "Insider Threat Detection",
 *   annualRecurring: 552000,
 *   pdfBase64: "<base64 string>",
 *   pdfFilename: "trendzact-proposal-TZ-2026-123456.pdf",
 *   cc: ["deal-desk@trendzact.com"]   // optional
 * }
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

// Deal desk always CC'd for compliance / audit trail
const DEFAULT_CC = ['deal-desk@trendzact.com'];

// The "from" address must be on a domain you've verified in Resend
const FROM = 'Trendzact Partners <proposals@partners.trendzact.com>';

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
    // Header is case-insensitive. Frontend sends X-Portal-Secret.
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
        proposalId,
        useCase,
        annualRecurring,
        pdfBase64,
        pdfFilename,
        cc = DEFAULT_CC
      } = req.body || {};

      // Minimal validation
      if (!to || !pdfBase64 || !pdfFilename || !company) {
        return res.status(400).json({
          error: 'Missing required fields: to, company, pdfBase64, pdfFilename'
        });
      }

      // TODO: verify Firebase Auth ID token from Authorization header
      // so only signed-in partners can send proposals.
      // const authHeader = req.headers.authorization || '';
      // const token = authHeader.replace(/^Bearer /, '');
      // const decoded = await admin.auth().verifyIdToken(token);
      // const partnerEmail = decoded.email;

      const resend = new Resend(resendApiKey.value());

      const firstName = contact ? contact.split(' ')[0] : 'there';
      const arr = annualRecurring
        ? '$' + Math.round(annualRecurring).toLocaleString('en-US')
        : 'see attached proposal';

      const emailResult = await resend.emails.send({
        from: FROM,
        to: [to],
        cc: cc,
        subject: `Trendzact GRC1 Proposal — ${company}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #353D4A; max-width: 560px;">
            <p>Hi ${firstName},</p>
            <p>Please find attached the Trendzact GRC1 proposal prepared for <strong>${company}</strong>.</p>
            <table style="border-collapse: collapse; margin: 20px 0;">
              <tr><td style="color: #7A7F88; padding: 4px 12px 4px 0;">Primary use case</td><td>${useCase || '—'}</td></tr>
              <tr><td style="color: #7A7F88; padding: 4px 12px 4px 0;">Indicative annual recurring</td><td><strong>${arr}</strong></td></tr>
              <tr><td style="color: #7A7F88; padding: 4px 12px 4px 0;">Proposal ID</td><td style="font-family: monospace;">${proposalId || '—'}</td></tr>
            </table>
            <p>Happy to walk through any section on a call. Reply to this email or reach us at <a href="mailto:deal-desk@trendzact.com" style="color: #00827C;">deal-desk@trendzact.com</a>.</p>
            <p style="margin-top: 28px;">Best regards,<br/>The Trendzact Partner Team</p>
            <hr style="border: none; border-top: 1px solid #EEF1F3; margin: 24px 0;" />
            <p style="font-size: 12px; color: #7A7F88;">
              Pricing shown in the attached proposal is indicative and subject to Trendzact Deal Desk approval.
              This document is confidential and intended only for the named recipient.
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
        to,
        cc,
        useCase: useCase || null,
        annualRecurring: annualRecurring || null,
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
