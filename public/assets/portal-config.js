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
// DEPLOY CHECKLIST:
//   1. Generate a random secret (see Part X of CHANGELOG)
//   2. Paste it as PORTAL_SHARED_SECRET below
//   3. Set the same value as a Firebase functions secret:
//      firebase functions:secrets:set PORTAL_SHARED_SECRET
//   4. The two must MATCH or every proposal submit will 401.
//
// ROTATION:
//   To rotate, generate a new secret, update this file, set the new
//   Firebase secret, deploy both hosting AND functions in the same deploy.
//   If they drift, deploys fail; briefly, live sends will 401.

(function () {
  'use strict';
  window.TrendzactConfig = Object.assign({}, window.TrendzactConfig || {}, {
    // !! REPLACE THIS WITH THE GENERATED SECRET BEFORE DEPLOY !!
    portalSecret: '47m7fgSbHsBidkZ9Y3Q/BNWPavIPMh86VcWlXHtzw5s=',

    // Endpoint for email pipeline — routed via firebase.json rewrite
    sendProposalUrl: '/api/send-proposal'
  });
})();
