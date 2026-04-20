# partner-portal-2026 — update v3

This update adds **email-on-submit**. When a partner clicks Submit on the proposal wizard, the browser still downloads the PDF locally; in parallel, a Cloud Function fires an email with the full proposal content in the body (HTML + plain text, multipart).

---

## What changed

| File | Status | Reason |
|---|---|---|
| `functions/index.js` | **replaced** | New `sendProposal` Cloud Function that validates auth, builds HTML+text email bodies, sends via Resend. |
| `functions/package.json` | **replaced / check diff** | Adds `resend` dependency. If your existing package.json has other deps I don't know about, diff-merge manually. |
| `public/assets/proposal-render.js` | **replaced** | `render()` now fires the email in parallel with the PDF download and returns an `emailPromise`. Also renders a 90-day pricing validity line below the TCV row on the PDF. |
| `public/assets/proposal-wizard.js` | **replaced** | `onSubmit` awaits the email promise; Step 4 success banner reports email status (sent / failed). Submit button relabeled "Submit, Download & Email". CC-To hint text updated. |

Everything else from v2 is unchanged. Don't re-deploy files that haven't changed.

## Files unchanged from v2

- `public/proposal.html`, `public/index.html`, `public/solution-builder.html`, `public/catalog.json`
- `public/assets/styles.css`, `public/assets/proposal-math.js`, `public/assets/header.js`, `public/assets/footer.js`

---

## Email behavior

**Recipients:**
- **From:** `Trendzact Deal Desk <deal-desk@trendzact.com>`
- **To:** The logged-in partner's email (verified against Firebase auth token server-side — prevents spoofing)
- **CC:** Whatever the partner typed in the CC-To field on Step 4 (parsed on comma or semicolon, validated as email format)
- **BCC:** `partner-proposals@trendzact.com` (pipeline tracking — partner doesn't see it in the email)
- **Reply-To:** `deal-desk@trendzact.com` — when recipients hit reply, their message goes to the deal desk. This is a deliberate choice so commercial questions route to Trendzact staff, not the partner. If a partner wants replies to come to them, they can forward the email rather than ask the prospect to reply directly.

All three Trendzact addresses are hardcoded in `functions/index.js` lines 40-47. Change them there if you need to.

**Content:**
- **Subject:** `Trendzact Proposal TZ-XXXXXXXX · Prospect Company`
- **Body:** Multipart — modern clients see HTML, text-only clients see plain text. Both contain the same content:
  - Proposal ID, prospect, contact, segment, licenses, term
  - Prospect challenge / pain points (from Step 1)
  - Full itemized selections grouped by category (Core / Modules / Options / Platform / One-Time)
  - Pricing block: recurring list → bundle discount → Y1/Y2/Y3 → one-time → TCV
  - Guidance text: "forward to the prospect at your discretion"

**Fire-and-report pattern:**
- PDF download is synchronous (browser save dialog opens immediately on Submit)
- Email is async; wizard awaits the result before swapping to the success banner
- If email fails, PDF still downloaded successfully — the wizard shows an amber warning line in the banner explaining the email error, and the partner still has their PDF

**Why no attachment:**
- Client-generated PDFs aren't easily attachable without an upload step
- Regenerating the PDF server-side would double the code path (jsPDF runs in browser, pdfmake or similar needed in Node)
- Decision: ship email-with-content-in-body now, revisit attachment in a future version if needed

---

## Pricing validity

Every proposal — both the PDF and the email — carries a 90-day pricing validity line below the TCV total.

**Where it appears:**
- **PDF:** below the Year 1 Total (single-year deals) or the TCV row (multi-year deals). Rendered as 8pt italic gray text.
- **Email HTML:** inside the green-tinted pricing card, below the TCV row. Rendered as 11px italic gray text with monospace dates.
- **Email plain text:** appended after the TCV total divider line.

**Copy:** `Pricing valid for 90 days from issue.  Issued 2026-04-20  ·  Expires 2026-07-19.`

**Date semantics:**
- "Issued" = the moment the Cloud Function runs (email send time) for the email, and the moment `render()` is called for the PDF. These fire within ~100ms of each other on Submit, so they'll match in practice.
- "Expires" = Issued + 90 days, computed in UTC so it's timezone-stable.
- Neither date is currently persisted anywhere — they're ephemeral, re-computed each time the proposal is rendered. If you ever re-render the same proposal (e.g., reopen a prior draft), you'll get fresh dates. This is an intentional simplification; if you want the issue date frozen at first-submit, that's a future change.

**No enforcement.** The portal doesn't currently block submission or refresh of proposals beyond 90 days. The validity line is informational — it tells the prospect "this pricing may not hold past this date," but nothing stops the partner from re-submitting on day 100 with the same numbers if they want to. Enforcement would require stored proposal history, which is out of scope for v1.

---

## !! Before this will actually send email — two prerequisites !!

The code is deployed and all addresses are pre-filled (deal-desk@ as sender, partner-proposals@ as BCC, deal-desk@ as Reply-To). But emails won't send until you complete both:

### 1. Verify the sender domain in Resend

In the Resend dashboard (https://resend.com/domains), add and verify `trendzact.com`. This takes DNS record additions (SPF, DKIM) in whatever DNS provider hosts the `trendzact.com` zone — usually 3-5 TXT records. Propagation is typically under 30 minutes but can take up to a few hours.

Until the domain is verified, Resend rejects sends from `deal-desk@trendzact.com` with `403 domain not verified`. The wizard will surface this as `EMAIL_SEND_FAILED` in the Step 4 banner.

If you want to smoke-test before DNS is ready, change `FROM_ADDRESS` in `functions/index.js` to `onboarding@resend.dev` (Resend's sandbox sender). Sandbox emails only deliver to the email on your Resend account — fine for testing, not for partners. Revert to `deal-desk@trendzact.com` once the real domain verifies.

### 2. Set the Resend API key as a Firebase secret

From your repo root, in PowerShell:

```powershell
firebase functions:secrets:set RESEND_API_KEY
```

Paste the Resend API key when prompted (starts with `re_`). Then redeploy functions so the secret is bound:

```powershell
firebase deploy --only functions
```

Older Firebase SDK versions use `firebase functions:config:set resend.api_key=...` instead. This code expects the newer secret-based approach (`process.env.RESEND_API_KEY`).

### Also: Firebase project must be on Blaze plan

Cloud Functions don't run on Spark (free) tier. If your project isn't already on Blaze:

1. Go to https://console.firebase.google.com/project/trendzact-partners-001/usage/details
2. Click "Modify plan" → Blaze (pay-as-you-go)
3. Add a billing account

Realistic monthly cost for a low-traffic partner portal: a few cents. Well under the free tier quotas most months.

---

## Deploy steps

### 1. Install the new dependency

In the `functions/` directory:

```powershell
cd functions
npm install
cd ..
```

This installs `resend` (and updates `package-lock.json`).

### 2. Commit and push

```powershell
git add -A
git status   # verify you see the expected files + package-lock.json
git commit -m "Add email-on-submit to proposal wizard

- sendProposal Cloud Function now builds HTML+text multipart email
  from the proposal draft and calculation, sends via Resend
- To: authenticated partner; CC: user-specified list; BCC: internal
  pipeline address; Reply-To: partner
- proposal-render.js fires email in parallel with client-side PDF
  download; wizard awaits email result and reports both outcomes
- Step 4 banner shows email status (sent/failed) alongside PDF status
- Adds resend dependency to functions/package.json"
git push
```

### 3. Deploy

Functions first (because hosting references them via rewrite):

```powershell
firebase deploy --only functions
firebase deploy --only hosting
```

Or do both at once:

```powershell
firebase deploy
```

### 4. Smoke test

After deploy:

1. Go to `/proposal`
2. Fill Step 1 (valid email, any segment, any term)
3. Step 2: select at least 1 module, acknowledge "None needed" on platform + one-time
4. Step 3: confirm review page
5. Step 4: fill proposal title, add yourself as a CC (to confirm CC delivery works)
6. Click Submit, Download & Email
7. Expected: PDF downloads, then success banner after a ~1-2 second pause says "Email copy sent to [your-email] and CC'd to [the CC you typed]"
8. Check your inbox — you should have the email in both your To and CC. If internal BCC is configured, check that inbox too.
9. Open email in Gmail web + Outlook web if possible. HTML version should render the branded proposal (green header band, pricing card, itemized tables).

---

## What if email fails?

The wizard handles this gracefully. If the Cloud Function returns an error (or the fetch fails entirely):

- PDF **still downloads successfully** (that path is independent)
- Success banner says: `Submitted. Proposal TZ-XXXXXXXX downloaded as [filename]. Email could not be sent ([error code]): [error message]. Your PDF downloaded successfully; the proposal ID is saved.`
- Draft is still cleared (the partner completed the proposal — only email is missing)
- Partner can forward the PDF manually

Known error codes the wizard may surface:

| Code | Meaning | Fix |
|---|---|---|
| `EMAIL_NOT_CONFIGURED` | Resend API key not set in Firebase secrets | `firebase functions:secrets:set RESEND_API_KEY` |
| `EMAIL_SEND_FAILED` | Resend API returned an error | Check function logs: `firebase functions:log` |
| `INVALID_CC` | A CC address doesn't parse as valid email | Partner fixes CC input and resubmits |
| `EMAIL_MISMATCH` | Auth token email ≠ partnerEmail | Shouldn't happen in normal flow; reload page |
| `HTTP_404` / `NETWORK_ERROR` | `/api/send-proposal` rewrite not configured | Verify `firebase.json` rewrites `/api/send-proposal` → `sendProposal` |
| `MISSING_TOKEN` | Firebase ID token not attached | Partner might be signed out — re-login |

---

## Open items / known deferrals

- **No retry logic.** If email fails, the partner has to clear and resubmit (which regenerates a new proposal ID). Worth adding an "Email failed — try again" button as a follow-up if retry becomes common.
- **Internal BCC is hardcoded.** If you want per-organization BCC routing (different partner orgs → different internal reps), that's a Firestore lookup + a bigger change. Not needed for v1.
- **No email template versioning.** The HTML in `buildHtmlBody()` is inline — edits go through code. If copy/design edits become frequent, consider extracting to a template file.
- **Resend webhook for delivery confirmation not wired.** We return success on API acceptance, not actual delivery. For most cases this is fine; if you want "confirmed delivered" vs "sent" distinction, add a webhook.
- **No rate limiting.** Nothing prevents a partner from spamming Submit. Low-risk given authenticated access, but worth adding a 1-per-5-seconds throttle in the wizard if it becomes an issue.

---

## Files in this bundle

```
partner-portal-2026-update-v3/
├── CHANGELOG.md                            # this file
├── functions/
│   ├── index.js                           # NEW sendProposal with Resend
│   └── package.json                       # adds resend dep
└── public/
    ├── catalog.json                       # unchanged from v2
    ├── index.html                         # unchanged from v2
    ├── proposal.html                      # unchanged from v2
    ├── solution-builder.html              # unchanged from v2
    └── assets/
        ├── footer.js                      # unchanged from v2
        ├── header.js                      # unchanged from v2
        ├── proposal-math.js               # unchanged from v2
        ├── proposal-render.js             # UPDATED: fires email
        ├── proposal-wizard.js             # UPDATED: awaits email result
        └── styles.css                     # unchanged from v2
```

Only `functions/index.js`, `functions/package.json`, `public/assets/proposal-render.js`, and `public/assets/proposal-wizard.js` are new/modified. The rest are included so you have a complete snapshot if you want it.
