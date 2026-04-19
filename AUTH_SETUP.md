# Auth Setup — Increment 1

Partners Portal authentication is now wired up. Before it works end-to-end, three one-time setup steps are required in the Firebase console.

## One-time Firebase console setup

### Step 1 — Enable Email/Password authentication

1. Go to **https://console.firebase.google.com/project/trendzact-partners-001/authentication/providers**
2. If prompted, click **Get started**
3. In the providers list, click **Email/Password**
4. Toggle **Enable** ON
5. **Also toggle ON "Email link (passwordless sign-in)"** — this enables the "Email me a sign-in link" button
6. Click **Save**

### Step 1a — Authorize the web.app domain for email links

Firebase only sends sign-in links that land on domains you've allowlisted:

1. Still in **Authentication**, click the **Settings** tab
2. Scroll to **Authorized domains**
3. Confirm `trendzact-partners-001.web.app` is listed (it usually is by default)
4. If you're using a custom domain later (e.g. `partners.trendzact.com`), add it here too

### Step 2 — Register a Web app and copy client config

1. Go to **https://console.firebase.google.com/project/trendzact-partners-001/settings/general**
2. Scroll to **"Your apps"**
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

**These values are public client identifiers — safe to commit.** They identify the project to Firebase Auth; they do not authorize any action on their own.

### Step 3 — Create the first test user manually

While Increment 2 (the `/api/admin/create-user` endpoint) is being built, you can create test users manually in the Firebase console:

1. Go to **https://console.firebase.google.com/project/trendzact-partners-001/authentication/users**
2. Click **Add user**
3. Enter the user's email
4. For password: **enter any random string** — the user will never see or need it. Firebase requires a password at creation; our flow immediately sends a reset email, so this value is throwaway.
5. Click **Add user**

**To force the user onto the password-setup flow:**

After creating the user, you have two options:

**Option A (simpler) — Click "Reset password" on the user row.** Firebase sends them the reset-link email directly. User clicks it, sets their password, signs in.

**Option B (what the production flow will do)** — Create a Firestore `users/{uid}` doc with `mustResetPassword: true`. On first login, the user gets bounced to `/set-password.html`, which is a single-button page that fires the reset email. Same outcome, but the user drives it from inside the portal instead of from an admin email.

For Increment 1 testing, Option A is faster. Increment 2's admin API will automate Option B.

## Testing the login flow

Once steps 1-2 are done:

1. Open **https://trendzact-partners-001.web.app/**
2. You should be redirected to `/login.html`
3. Sign in with the test user you created in Step 3
4. You should land on the portal home page
5. The utility bar at the top should show your real email instead of the placeholder

If that works, Increment 1 is complete.

## What's still NOT working

Intentionally not in this increment:

- **Role-based page gating** — any signed-in user sees all pages. Coming in Increment 2.
- **Creating users via API** — still a manual Firebase console step. Coming in Increment 2.
- **Forced password reset on first login** — works if you manually set `mustResetPassword: true` in Firestore. Auto-set by the API in Increment 2.
- **Welcome emails** — not sent. Coming in Increment 2.

## Troubleshooting

**Sign-in fails with "API key not valid"**
→ `firebase-config.js` still has placeholder values. Replace with real values from step 2.

**Page hangs on "Signing in..."**
→ Email/Password provider not enabled. Complete step 1.

**After login, immediately redirected back to login.html**
→ Likely a Firestore rules issue. For Increment 1, Firestore rules aren't required — auth.js handles the missing-doc case gracefully. Check browser console for errors.

**"Firebase: Error (auth/configuration-not-found)"**
→ No web app registered in Firebase console. Complete step 2.

**Real user stays in the utility bar even after sign-out**
→ Hard-refresh the page. The header utility bar is populated async and caches the last state briefly.
