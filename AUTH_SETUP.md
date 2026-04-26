# Auth Setup

Partners Portal authentication runs on Firebase Auth. This doc covers both the
one-time project setup and the day-to-day flow for adding new partner users.

## Onboarding a new partner (routine)

This is the documented flow for adding a new partner account. It's a two-step
process in the Firebase console and takes about 30 seconds per user.

### Why two steps

Firebase Auth does not send any email when an account is created. You have to
create the account first, then trigger the password-reset email separately.
This is by design — Firebase gives you the primitives, the product decides
when to email.

We use the reset-email as the welcome email: it's a Firebase-hosted page the
user trusts, it forces a proper password on first use, and we don't have to
maintain our own welcome-email template.

### The steps

1. **Go to the Firebase user list**
   https://console.firebase.google.com/project/trendzact-partners-001/authentication/users

2. **Click `Add user`**
   - **Email**: the partner's work email
   - **Password**: type anything — `xxxxxxxx`, the string `throwaway`, whatever. The user will never see it. Firebase requires a password at creation time, but our flow replaces it immediately.
   - Click **Add user**

3. **Find the new user in the list and click the three-dot menu on their row → `Reset password`**
   Firebase sends them a branded password-reset email.

4. **Partner clicks the link in the email, sets their own password, lands on the Partners Portal login, signs in.** Done.

### What the partner sees

The email comes from `noreply@trendzact-partners-001.firebaseapp.com` with
the subject "Reset your password for trendzact-partners-001". The email body
is minimal Firebase-brand chrome with a single button. After clicking, they
set a password on a Firebase-hosted page, then get bounced to our login page
with a success banner ("Password changed. Sign in with your new password.").

### Tell the partner to expect the email

Send them a heads-up — a Slack message, a quick calendar invite note, or a
plain email — so the Firebase-branded password-reset email doesn't look like
phishing. Something like:

> "I just set up your account on the Trendzact Partners Portal. You'll
> get an email from trendzact-partners-001 in the next minute or two with
> a link to set your password. Click it, set a password, and you're in.
> Portal URL: https://trendzact-partners-001.web.app/"

### Troubleshooting the invite

**Partner says they didn't get the email** — check spam. Firebase's sender
domain is not on most corporate allowlists by default. If still missing,
re-click "Reset password" in the console; the old link stays valid but a
new email is sent.

**Partner clicked the link, got "invalid or expired"** — reset links expire
after ~1 hour. Click "Reset password" again in the console.

**Partner signs in but can't see pages properly** — not an auth issue. All
signed-in users see all pages in the current setup. Role-based gating is
planned for a later increment.

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
- **Branded welcome email from our domain** — we use the Firebase-hosted
  reset email because it works out of the box. If the Firebase sender
  becomes a deliverability problem, the upgrade path is: Cloud Function
  generates a password-reset action code, Resend sends a branded email
  using the same pipeline as the proposal builder.
- **Admin API for creating users** — manual console step. Build this only
  if the onboarding volume justifies it (more than a few per week).

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
→ Check spam. If still missing, click "Reset password" again in the console.
The Firebase sender (`noreply@trendzact-partners-001.firebaseapp.com`) is
not on most corporate allowlists by default.

**Reset link says "invalid or expired"**
→ Links expire after ~1 hour. Send a new one from the console.
