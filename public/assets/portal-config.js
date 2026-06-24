// Trendzact Partners — Portal Config
//
// This file exposes portal-wide configuration to the client bundle.
// In particular: the X-Portal-Secret value that the sendProposal Cloud
// Function requires on every request.
//
// SECURITY NOTE:
//   This is NOT real authentication. The shared secret is baked into
//   the public frontend bundle, so anyone who inspects the page source
//   can extract it. This is KISS protection against casual abuse —
//   random internet users can't trivially spam the /api/send-proposal
//   endpoint, but a determined actor could. When partner traffic
//   justifies real auth, replace with Firebase Auth ID token
//   verification (the old function code has a TODO for this).
//
// !! DO NOT COMMIT THE REAL SECRET TO THIS FILE !!
//   The placeholder below is the tracked default. Replace it locally
//   before `firebase deploy`, but reset to the placeholder before any
//   git commit. If a real value is ever committed, ROTATE the secret
//   (see ROTATION below) — the leaked one must be considered burned.
//
// DEPLOY CHECKLIST:
//   1. Generate a random secret:  openssl rand -base64 32
//   2. Paste it as the portalSecret value below (LOCAL ONLY)
//   3. Set the same value as a Firebase functions secret:
//      firebase functions:secrets:set PORTAL_SHARED_SECRET
//   4. The two must MATCH or every proposal submit will 401.
//   5. Deploy hosting + functions in the same deploy.
//   6. Reset this file to the placeholder before committing.
//
// ROTATION:
//   To rotate, generate a new secret, update this file locally, set the
//   new Firebase secret, deploy both hosting AND functions in the same
//   deploy. If they drift, briefly live sends will 401.

(function () {
  'use strict';
  window.TrendzactConfig = Object.assign({}, window.TrendzactConfig || {}, {
    // !! REPLACE THIS WITH THE GENERATED SECRET BEFORE DEPLOY !!
    // !! DO NOT COMMIT THE REAL VALUE — RESET TO PLACEHOLDER FIRST pyOZJMhJqyMCkOFx+7x9m7Jlnjx/5xVxvQg8WtkvV60=!!
    // REPLACE_ME_WITH_GENERATED_SECRET
    portalSecret: 'pyOZJMhJqyMCkOFx+7x9m7Jlnjx/5xVxvQg8WtkvV60=',

    // Endpoint for email pipeline — routed via firebase.json rewrite
    sendProposalUrl: '/api/send-proposal'
  });
})();
