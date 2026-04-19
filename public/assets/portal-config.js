// Trendzact Partners — Portal Config
//
// KISS shared-secret protection for the backend Cloud Function.
// Not real auth — meant to block casual URL discovery until proper auth is wired up.
//
// SETUP:
//   1. Generate a random string (e.g.  openssl rand -hex 24 )
//   2. Paste the same value here AND set it as a Firebase secret:
//        firebase functions:secrets:set PORTAL_SHARED_SECRET
//   3. Rotate whenever someone leaves the partner team
//
// REPLACE THIS VALUE:
window.PORTAL_CONFIG = {
  sharedSecret: 'CHANGE_ME_before_deploying'
};
