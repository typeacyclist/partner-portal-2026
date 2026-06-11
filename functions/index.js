const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const crypto = require('crypto');
const { Resend } = require('resend');

admin.initializeApp();

const resendApiKey = defineSecret('RESEND_API_KEY');
const portalSecret = defineSecret('PORTAL_SHARED_SECRET');

const DEFAULT_BCC = ['deal-desk@trendzact.com'];
const FROM_PROPOSAL = 'Trendzact Deal Desk <deal-desk@trendzact.com>';
const FROM_AUTH = 'Trendzact Partners <noreply@trendzact-partners.com>';
const AUTH_REPLY_TO = 'deal-desk@trendzact.com';
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
          from: FROM_PROPOSAL,
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

// =========================================================================
// sendPasswordReset
// =========================================================================
// Replaces the client-side Firebase SDK call to sendPasswordResetEmail().
// We do this server-side so the reset email goes through Resend (branded,
// from noreply@trendzact-partners.com) instead of through Firebase's default
// sender (noreply@trendzact-partners-001.firebaseapp.com), which has poor
// deliverability against corporate spam filters.
//
// Flow:
//   1. Verify X-Portal-Secret header (same auth as sendProposal/sendContact)
//   2. Validate the input email
//   3. Check the user exists in Firebase Auth. If not, silent-success
//      (anti-enumeration — don't reveal which addresses are partners)
//   4. Generate a Firebase password-reset action link via Admin SDK
//   5. Send a branded HTML email via Resend that wraps the link
//   6. Record the send in Firestore for audit
exports.sendPasswordReset = onRequest(
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
        const { email, continueUrl } = req.body || {};
        const cleanEmail = extractEmailAddress(email || '');
        if (!isLikelyEmail(cleanEmail)) {
          return res.status(400).json({ error: 'Valid email required' });
        }

        // Anti-enumeration: silent-success when the user doesn't exist.
        // Caller can't distinguish "sent" from "no such user".
        try {
          await admin.auth().getUserByEmail(cleanEmail);
        } catch (err) {
          if (err && err.code === 'auth/user-not-found') {
            return res.status(200).json({ ok: true });
          }
          throw err;
        }

        const actionCodeSettings = {
          url: continueUrl || 'https://trendzact-partners-001.web.app/login.html?reset=success',
          handleCodeInApp: false
        };
        const resetLink = await admin.auth().generatePasswordResetLink(cleanEmail, actionCodeSettings);

        const resend = new Resend(resendApiKey.value());
        const emailResult = await resend.emails.send({
          from: FROM_AUTH,
          replyTo: AUTH_REPLY_TO,
          to: [cleanEmail],
          subject: 'Reset your Trendzact Partners password',
          text: buildPasswordResetTextBody({ resetLink }),
          html: buildPasswordResetHtmlBody({ resetLink, email: cleanEmail })
        });

        await admin.firestore().collection('auth_emails_sent').add({
          type: 'password_reset',
          email: cleanEmail,
          resendId: emailResult.data?.id || null,
          sentAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return res.status(200).json({ ok: true, resendId: emailResult.data?.id });
      } catch (err) {
        console.error('sendPasswordReset error:', err);
        return res.status(500).json({ error: 'Failed to send reset email', message: err.message });
      }
    }
);

// =========================================================================
// sendUserInvite
// =========================================================================
// Onboards a new partner user. Creates the Firebase Auth account if it
// doesn't exist, seeds users/{uid} with mustResetPassword: true, then
// emails a Firebase password-reset link via Resend so the recipient sets
// their own password on first use. If the account already exists, this
// just re-sends the invite (useful for re-inviting after a missed email).
//
// Flow:
//   1. Verify X-Portal-Secret
//   2. Validate email + optional displayName
//   3. getUserByEmail — if not found, createUser with a random throwaway
//      password and seed users/{uid} with mustResetPassword: true
//   4. Generate password-reset link (acts as the invite link)
//   5. Send branded welcome email via Resend
//   6. Record the send in Firestore
//
// Admins call this directly (curl/Postman) for now; a UI can be added
// later if onboarding volume justifies it.
exports.sendUserInvite = onRequest(
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
        const { email, displayName, continueUrl } = req.body || {};
        const cleanEmail = extractEmailAddress(email || '');
        if (!isLikelyEmail(cleanEmail)) {
          return res.status(400).json({ error: 'Valid email required' });
        }
        const cleanDisplayName = displayName ? String(displayName).trim().slice(0, 80) : null;

        let userExisted = true;
        let user;
        try {
          user = await admin.auth().getUserByEmail(cleanEmail);
        } catch (err) {
          if (err && err.code !== 'auth/user-not-found') throw err;
          userExisted = false;
          // Throwaway password — user replaces it via the reset link.
          // Suffix guarantees it satisfies the project password policy
          // (upper/lower/digit/non-alphanumeric); base64 alone can miss the symbol.
          const tempPassword = crypto.randomBytes(24).toString('base64') + 'Aa1!';
          user = await admin.auth().createUser({
            email: cleanEmail,
            password: tempPassword,
            displayName: cleanDisplayName || undefined,
            emailVerified: false,
            disabled: false
          });
          // mustResetPassword: true forces /set-password.html if they
          // ever sign in without using the invite link.
          await admin.firestore().collection('users').doc(user.uid).set({
            email: cleanEmail,
            displayName: cleanDisplayName,
            mustResetPassword: true,
            invitedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        }

        const actionCodeSettings = {
          url: continueUrl || 'https://trendzact-partners-001.web.app/login.html?invite=success',
          handleCodeInApp: false
        };
        const resetLink = await admin.auth().generatePasswordResetLink(cleanEmail, actionCodeSettings);

        const resend = new Resend(resendApiKey.value());
        const emailResult = await resend.emails.send({
          from: FROM_AUTH,
          replyTo: AUTH_REPLY_TO,
          to: [cleanEmail],
          subject: 'Welcome to Trendzact Partners — set your password',
          text: buildInviteTextBody({ resetLink, displayName: cleanDisplayName }),
          html: buildInviteHtmlBody({ resetLink, email: cleanEmail, displayName: cleanDisplayName })
        });

        await admin.firestore().collection('auth_emails_sent').add({
          type: 'invite',
          email: cleanEmail,
          displayName: cleanDisplayName,
          userExisted,
          uid: user.uid,
          resendId: emailResult.data?.id || null,
          sentAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return res.status(200).json({ ok: true, userExisted, uid: user.uid, resendId: emailResult.data?.id });
      } catch (err) {
        console.error('sendUserInvite error:', err);
        return res.status(500).json({ error: 'Failed to send invite', message: err.message });
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
          from: FROM_PROPOSAL,
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

// =========================================================================
// Auth-email templates (password reset + new user invite)
// =========================================================================
// Both share the same visual style as the proposal/contact emails: inline
// CSS, brand colors (#353D4A / #00827C / #00A398 / #F0FAF9). The CTA
// button uses dark green with white text; the raw URL is also shown
// underneath as a fallback for mail clients that block buttons.

function authEmailShell(opts) {
  // Common wrapper: header bar, content block, footer note.
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #353D4A; max-width: 560px; margin: 0; padding: 0;">
      <div style="background: #00827C; padding: 16px 20px; color: #fff;">
        <div style="font-size: 13px; letter-spacing: 0.06em; text-transform: uppercase; opacity: 0.85;">Trendzact Partners</div>
        <div style="font-size: 20px; font-weight: 600; margin-top: 2px;">${escapeHtml(opts.title)}</div>
      </div>
      <div style="padding: 20px; line-height: 1.55;">
        ${opts.body}
        <div style="margin: 24px 0;">
          <a href="${escapeHtml(opts.cta.href)}" style="display: inline-block; background: #00827C; color: #fff; text-decoration: none; padding: 12px 22px; border-radius: 6px; font-weight: 600;">${escapeHtml(opts.cta.label)}</a>
        </div>
        <p style="font-size: 12px; color: #7A7F88; margin: 0 0 4px;">Or paste this URL into your browser:</p>
        <p style="font-size: 11px; color: #353D4A; word-break: break-all; margin: 0 0 16px;"><a href="${escapeHtml(opts.cta.href)}" style="color: #00827C;">${escapeHtml(opts.cta.href)}</a></p>
        <hr style="border: 0; border-top: 1px solid #EEF1F3; margin: 20px 0;" />
        <p style="font-size: 12px; color: #7A7F88; margin: 0;">${escapeHtml(opts.footer)}</p>
      </div>
    </div>
  `;
}

function buildPasswordResetTextBody(ctx) {
  return [
    'Reset your Trendzact Partners password',
    '',
    'You (or someone using your address) requested to reset the password',
    'for your Trendzact Partners account.',
    '',
    'Open this link to set a new password:',
    ctx.resetLink,
    '',
    "If you didn't request a reset, you can ignore this email — your",
    'password will stay unchanged.',
    '',
    '— Trendzact Partners',
    'Questions? deal-desk@trendzact.com'
  ].join('\n');
}

function buildPasswordResetHtmlBody(ctx) {
  return authEmailShell({
    title: 'Reset your password',
    body: `
      <p style="margin: 0 0 12px;">You (or someone using <strong>${escapeHtml(ctx.email)}</strong>) requested to reset the password for your Trendzact Partners account.</p>
      <p style="margin: 0 0 12px;">Click the button below to set a new password. The link expires in 1 hour.</p>
    `,
    cta: { href: ctx.resetLink, label: 'Set a new password' },
    footer: "If you didn't request this, ignore the email — your password stays unchanged. Questions? Email deal-desk@trendzact.com."
  });
}

function buildInviteTextBody(ctx) {
  const greeting = ctx.displayName ? `Hi ${ctx.displayName},` : 'Hi,';
  return [
    'Welcome to the Trendzact Partners Portal',
    '',
    greeting,
    '',
    "We've created your account on the Trendzact Partners Portal.",
    'To activate it, set your password using the link below:',
    '',
    ctx.resetLink,
    '',
    'Portal URL: https://trendzact-partners-001.web.app/',
    '',
    'Questions? Contact deal-desk@trendzact.com.',
    '',
    '— Trendzact Partners'
  ].join('\n');
}

function buildInviteHtmlBody(ctx) {
  const greeting = ctx.displayName ? `Hi ${escapeHtml(ctx.displayName)},` : 'Hi,';
  return authEmailShell({
    title: 'Welcome to Trendzact Partners',
    body: `
      <p style="margin: 0 0 12px;">${greeting}</p>
      <p style="margin: 0 0 12px;">We've created your account on the Trendzact Partners Portal (<strong>${escapeHtml(ctx.email)}</strong>). To activate it, set your password using the button below.</p>
      <p style="margin: 0 0 12px;">After setting a password, sign in at <a href="https://trendzact-partners-001.web.app/" style="color: #00827C;">trendzact-partners-001.web.app</a>.</p>
    `,
    cta: { href: ctx.resetLink, label: 'Set your password' },
    footer: 'Questions? Contact deal-desk@trendzact.com.'
  });
}