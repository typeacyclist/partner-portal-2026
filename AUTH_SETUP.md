# Auth Setup

Partners Portal authentication runs on Firebase Auth. New-user invite and
password-reset emails are sent through **Resend** via Cloud Functions —
not through Firebase's default email infrastructure — because
`noreply@trendzact-partners-001.firebaseapp.com` has poor deliverability
against corporate spam filters.

The two relevant Cloud Functions are:

| Function | Endpoint | Purpose |
|---|---|---|
| `sendUserInvite` | `POST /api/send-user-invite` | Creates a Firebase Auth user (if needed), seeds `users/{uid}` with `mustResetPassword: true`, and emails a branded welcome with a password-set link. |
| `sendPasswordReset` | `POST /api/send-password-reset` | Sends a branded password-reset email. Wired into the "Forgot password?" link on `/login`. |

Both authenticate with the same `X-Portal-Secret` header as `sendProposal`
/ `sendContact`, and both use the `Trendzact Deal Desk <deal-desk@trendzact.com>`
sender (already verified in Resend).

## Onboarding a new partner (routine)

Call `sendUserInvite` with the partner's email. The function handles user
creation and emails the invite in one step.

### Via TrendzactPartnerPortalUserMgmt.exe (Windows GUI, zero typing — recommended)

Double-click **`TrendzactPartnerPortalUserMgmt.exe`** at the repo root. A small window appears:

- Enter the partner's email + display name
- Paste your `PORTAL_SHARED_SECRET` (tick "Remember on this PC" to save it as an env var so you don't paste it again next time)
- Click **Send Invite**

Result is shown inline: UID, Resend ID, and a confirmation that the email is on its way. Built from `scripts/invite-user-gui.ps1`; rebuild after edits with `.\scripts\Build-PartnerPortalUserMgmtExe.ps1`.

### Via PowerShell helper (terminal-friendly alternative)

```powershell
.\scripts\send-user-invite.ps1 -Email partner@partnerco.com -DisplayName "Jane Smith"
```

The script prompts securely for `PORTAL_SHARED_SECRET` if it's not already
set in `$env:PORTAL_SHARED_SECRET`. To resend the reset link to a user who
missed the first email (or to handle a partner request for "I forgot my
password"):

```powershell
.\scripts\send-password-reset.ps1 -Email partner@partnerco.com
```

### Via curl

```bash
SECRET="<your-PORTAL_SHARED_SECRET>"
curl -X POST "https://trendzact-partners-001.web.app/api/send-user-invite" \
  -H "Content-Type: application/json" \
  -H "X-Portal-Secret: ${SECRET}" \
  -d '{"email":"partner@partnerco.com","displayName":"Jane Smith"}'
```

Response (either method):
```json
{ "ok": true, "userExisted": false, "uid": "abc...", "resendId": "..." }
```

`userExisted: false` means we just created the account. `true` means it
already existed and we just re-sent the invite link.

### What the partner sees

A branded email from **Trendzact Deal Desk &lt;deal-desk@trendzact.com&gt;**
with subject "Welcome to Trendzact Partners — set your password". The
"Set your password" button links to a Firebase action URL where they
choose their password, then they're bounced to `/login.html?invite=success`
to sign in.

### Re-inviting

If the partner missed the first email, re-run the same curl command. It's
idempotent — the function won't create a duplicate user; it just generates
a fresh password-reset link (the previous one is still valid until expiry
but the new one supersedes it semantically).

### Manual fallback via Firebase Console

You can still use the manual two-step console flow (Add user → Reset
password) as a backup, but those emails go through Firebase's default
sender and are likely to be filtered. Prefer the curl invite above.

### Troubleshooting the invite

**Partner says they didn't get the email** — check spam (less likely with
Resend than Firebase's default sender, but still possible). Check the
`auth_emails_sent` Firestore collection for the corresponding entry — the
`resendId` lets you look it up in the Resend dashboard.

**Partner clicked the link, got "invalid or expired"** — Firebase password
reset action codes expire after ~1 hour. Re-send the invite.

**Partner signs in but can't see pages properly** — not an auth issue.
All signed-in users see all pages in the current setup. Role-based gating
is planned for a later increment.

---

## One-time Firebase console setup

If you're setting up a new project (or rebuilding after a Firebase reset),
run through these three steps once. Skip to the routine flow above if
auth is already working.

### Step 1 — Enable Email/Password authentication

1. Go to **https://console.firebase.google.com/project/trendzact-partners-001/authentication/providers**
2. If prompted, click **Get started**
3. In the providers list, click **Email/Password**
4. Toggle **Enable** ON
5. **Also toggle ON "Email link (passwordless sign-in)"** — this enables the "Email me a sign-in link" button on the login page
6. Click **Save**

### Step 1a — Authorize the web.app domain for email links

Firebase only sends sign-in links that land on domains you've allowlisted:

1. Still in **Authentication**, click the **Settings** tab
2. Scroll to **Authorized domains**
3. Confirm `trendzact-partners-001.web.app` is listed (it usually is by default)
4. If you're using a custom domain later (e.g. `partners.trendzact.com`), add it here too

### Step 2 — Register a Web app and copy client config

1. Go to **https://console.firebase.google.com/project/trendzact-partners-001/settings/general**
2. Scroll to **Your apps**
3. If no Web app is registered, click the **</>** (Web) icon → register with nickname "Partners Portal" → click **Register app**
4. Firebase shows a `firebaseConfig` object. Copy the values.
5. Open `public/assets/firebase-config.js` in your editor
6. Replace the `REPLACE_ME_FROM_FIREBASE_CONSOLE` values with the real ones
7. Commit and push — the site deploys automatically

Example of what the populated file looks like:

```js
window.FIREBASE_CONFIG = {
  apiKey: 'AIzaSy...real-value...',
  authDomain: 'trendzact-partners-001.firebaseapp.com',
  projectId: 'trendzact-partners-001',
  storageBucket: 'trendzact-partners-001.firebasestorage.app',
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:abcdef123456'
};
```

**These values are public client identifiers — safe to commit.** They identify
the project to Firebase Auth; they do not authorize any action on their own.

### Step 3 — Create the first admin/test user

Same two-step flow as "Onboarding a new partner" above — use it for yourself
the first time, confirm you can sign in, then use it for real partners.

---

## Testing the login flow

Once setup is done and at least one user exists:

1. Open **https://trendzact-partners-001.web.app/**
2. You should be redirected to `/login.html`
3. Sign in with the test user
4. You should land on the portal home page
5. The utility bar at the top should show your real email instead of the placeholder

---

## What's intentionally NOT built

These aren't limitations to work around — they're scope decisions.

- **Role-based page gating** — any signed-in user sees all pages. Fine for
  the current partner cohort; revisit when access boundaries matter.
- **Self-service signup** — by design, access is by Trendzact invitation only.
  No public signup page exists.
- **Admin UI for invites** — `sendUserInvite` is a backend-only Cloud
  Function for now. Admins call it via curl. Build a `/internal/invite-user.html`
  form only if invite volume justifies it.

---

## Troubleshooting auth itself

**Sign-in fails with "API key not valid"**
→ `firebase-config.js` still has placeholder values. Replace with real values from Step 2.

**Page hangs on "Signing in..."**
→ Email/Password provider not enabled. Complete Step 1.

**After login, immediately redirected back to login.html**
→ Likely a Firestore rules issue. Check browser console for errors.

**"Firebase: Error (auth/configuration-not-found)"**
→ No web app registered in Firebase console. Complete Step 2.

**Real user stays in the utility bar even after sign-out**
→ Hard-refresh the page. The header utility bar is populated async and
caches the last state briefly.

**User says password reset email never arrived**
→ Reset emails now go through Resend (sender: `deal-desk@trendzact.com`).
Check spam first. Then check the `auth_emails_sent` Firestore collection
for an entry matching the email — the `resendId` lets you look it up in
the Resend dashboard for bounce/delivery status. If no Firestore entry,
the function failed; check Cloud Function logs (`firebase functions:log
--only sendPasswordReset`).

**Reset link says "invalid or expired"**
→ Firebase password-reset action codes expire after ~1 hour. Re-trigger
"Forgot password" on /login or re-run the invite curl.
