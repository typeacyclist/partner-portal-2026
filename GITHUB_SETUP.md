# Uploading to GitHub

Step-by-step guide to get this project into GitHub and (optionally) auto-deploying to Firebase on every push.

## 1. Create the GitHub repo

On github.com:
1. Click **+ → New repository**
2. Name it something like `trendzact-partners-portal`
3. Set to **Private** (this is partner-only content — important)
4. Do **NOT** initialize with README, .gitignore, or LICENSE — we already have all three
5. Click **Create repository**

GitHub will show you the push-existing-repo commands — we'll use those in step 3.

## 2. Initialize git locally

Open a terminal in the project folder (the one containing `firebase.json`):

```bash
cd trendzact-partners

git init
git add .
git commit -m "Initial commit — Partners Portal v2"
git branch -M main
```

## 3. Push to GitHub

Replace `YOUR-ORG` and `trendzact-partners-portal` with your actual values from step 1:

```bash
git remote add origin https://github.com/YOUR-ORG/trendzact-partners-portal.git
git push -u origin main
```

If you prefer SSH (after setting up SSH keys):

```bash
git remote add origin git@github.com:YOUR-ORG/trendzact-partners-portal.git
git push -u origin main
```

Done — code is in GitHub.

## 4. (Optional) Auto-deploy on push

The repo ships with `.github/workflows/firebase-deploy.yml` which will:
- Deploy to a **preview channel** when you open a pull request (expires after 7 days)
- Deploy to **production** when PRs merge to `main`

To enable it:

### 4a. Generate a Firebase service account

In Google Cloud Console, for your Firebase project:
1. Go to **IAM & Admin → Service Accounts**
2. Click **Create Service Account**
3. Name: `github-actions-deploy`
4. Grant these roles:
   - **Firebase Hosting Admin**
   - **Cloud Functions Admin** (only if you want Actions to deploy functions too)
   - **Service Account User**
5. Create a **JSON key** for the account. It will download a `*.json` file
6. **Never commit this file.** `.gitignore` already excludes `service-account*.json`

### 4b. Add GitHub repo secrets

On GitHub, in your repo: **Settings → Secrets and variables → Actions → New repository secret**

Add two secrets:

| Name | Value |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | Paste the **entire contents** of the JSON key file from step 4a |
| `FIREBASE_PROJECT_ID` | Your Firebase project ID (e.g. `trendzact-partners`) |

### 4c. Verify

Open a pull request with any small change. You should see the GitHub Actions job run and comment on the PR with a preview URL.

## What's in the repo

```
trendzact-partners/
├── .github/workflows/       Auto-deploy config
├── .gitignore               Keeps secrets, node_modules, logs out
├── LICENSE                  Confidentiality terms
├── README.md                Full project docs
├── firebase.json            Hosting + functions routing
├── .firebaserc              Firebase project binding
├── public/                  Static site (HTML + JS + CSS)
│   ├── index.html
│   ├── ... 12 more pages
│   └── assets/
└── functions/               Cloud Function for email send
    ├── index.js
    └── package.json
```

## What's NOT in the repo (intentionally)

- `functions/node_modules/` — installed locally during deploy, not committed
- Firebase service-account JSON files — stored as GitHub secrets instead
- The `PORTAL_SHARED_SECRET` value — stored as a Firebase secret, not in code
- The `RESEND_API_KEY` value — same, Firebase secret only

**Important:** Before pushing for the first time, double-check that `public/assets/portal-config.js` still has the placeholder `'CHANGE_ME_before_deploying'` — the real secret should live only in Firebase secrets, not in the repo. The config file is a template; you set the real value during deploy.

## Branch protection (recommended)

On GitHub: **Settings → Branches → Add branch protection rule**

For `main`:
- ✅ Require a pull request before merging
- ✅ Require status checks to pass (once the workflow runs once)
- ✅ Do not allow bypassing the above settings

This means no one (including you) can push directly to main — everything goes through PR review, which forces the preview deploy step.
