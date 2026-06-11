#!/usr/bin/env node
// Deploy guard (wired as firebase.json hosting.predeploy).
//
// Refuses any hosting deploy while public/assets/portal-config.js still holds
// the tracked placeholder secret. CI's "Inject PORTAL_SHARED_SECRET" step
// replaces the placeholder BEFORE `firebase deploy` runs, so this passes in CI
// and only fires on manual/local deploys (firebase deploy, scripts/deploy.ps1,
// npm run deploy:*) that forgot to inject the real secret — which is exactly
// what silently shipped the placeholder to production once before.
//
// Runs from the project root (where firebase.json lives).

'use strict';

var fs = require('fs');

var FILE = 'public/assets/portal-config.js';
var PLACEHOLDER = 'REPLACE_ME_WITH_GENERATED_SECRET';

var content;
try {
  content = fs.readFileSync(FILE, 'utf8');
} catch (e) {
  console.error('[predeploy] Could not read ' + FILE + ': ' + e.message);
  process.exit(1);
}

if (content.indexOf(PLACEHOLDER) !== -1) {
  console.error('');
  console.error('[predeploy] ABORT: ' + FILE + ' still contains the placeholder secret.');
  console.error('[predeploy] Deploying now would overwrite the live portal secret with the');
  console.error('[predeploy] placeholder and break proposal-email sending (NO_SECRET).');
  console.error('');
  console.error('[predeploy] Fix: deploy through CI (push to main / open a PR) — it injects the');
  console.error('[predeploy] secret automatically. For a one-off local deploy, paste the real');
  console.error('[predeploy] PORTAL_SHARED_SECRET into ' + FILE + ' first, then reset it back to');
  console.error('[predeploy] the placeholder before committing.');
  console.error('');
  process.exit(1);
}

console.log('[predeploy] portal-config.js secret OK (placeholder not present).');
