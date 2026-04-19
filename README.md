# Trendzact Partners Portal

Firebase-hosted partner enablement website for Trendzact GRC1 distributors and resellers,
with client-side PDF generation and server-side email delivery for the Proposal Builder.

## What's new in v2

- **Proposal Builder now generates a real PDF** — 3-page branded PDF with cover, pricing table, and next steps
- **Three send options** on the Proposal Builder:
  1. **Download PDF** — partner downloads and handles distribution themselves
  2. **Email Draft** — downloads PDF and opens default mail client with pre-filled subject/body (partner attaches the downloaded PDF)
  3. **Send via Email** — partner enters recipient, Cloud Function emails the PDF directly via Resend, CC's the deal desk, logs to Firestore

## Structure

```
trendzact-partners/
├── firebase.json              # Hosting + functions config, /api/* → Cloud Function
├── .firebaserc
├── public/                    # Deployed static site
│   ├── index.html
│   ├── solution-builder.html
│   ├── proposal-builder.html  # With jsPDF + email modal
│   ├── sales-order.html
│   ├── (+ 9 more pages)
│   └── assets/
│       ├── styles.css
│       ├── app.js             # Nav toggle, filters, live pricing
│       ├── proposal-pdf.js    # PDF builder using jsPDF
│       └── favicon.svg
└── functions/                 # Firebase Cloud Functions
    ├── package.json
    └── index.js               # sendProposal — emails PDF via Resend
```

## PDF generation — how it works

The Proposal Builder form data is passed to **jsPDF** (loaded from CDN) which
builds a real selectable-text PDF client-side. No backend involvement for the PDF itself.

See `public/assets/proposal-pdf.js` — the `window.TrendzactProposal` object exposes:

```js
TrendzactProposal.download()            // generate + download
TrendzactProposal.emailViaMailto()      // download + open mail client draft
TrendzactProposal.emailViaBackend(url, recipient)  // POST to Cloud Function
TrendzactProposal.blob()                // raw Blob for custom handling
```

The PDF has three pages:
1. **Cover** — company, primary contact, key details, indicative ARR hero
2. **Scope & pricing** — module table with totals and service model
3. **Next steps** — 4-step process and deal desk contact block

## Email delivery — setup

The "Send via Email" button POSTs to `/api/send-proposal`, rewritten to the
`sendProposal` Cloud Function. The function uses [Resend](https://resend.com) —
generous free tier, simple API, clean deliverability.

### One-time setup

```bash
# 1. Get a Resend API key from resend.com
# 2. Verify a sending domain in Resend (e.g. partners.trendzact.com)
# 3. Update the FROM address in functions/index.js to match

# 4. Install function dependencies
cd functions && npm install && cd ..

# 5. Generate a shared secret for the portal ↔ backend link
openssl rand -hex 24
#   Copy the output. Paste it in TWO places:
#     a) public/assets/portal-config.js  →  sharedSecret: '...'
#     b) Firebase secret:
firebase functions:secrets:set PORTAL_SHARED_SECRET
#        (paste the same value when prompted)

# 6. Set the Resend API key as a Firebase secret
firebase functions:secrets:set RESEND_API_KEY
# (paste your key when prompted)

# 7. Deploy
firebase deploy
```

> **Note on the shared secret:** this is KISS protection — it blocks casual URL discovery but is not real auth (the secret sits in the browser, readable by anyone who views source). Replace with Firebase Auth ID token verification before partners get real access. See the `TODO` block in `functions/index.js`.

### Alternatives

- **SendGrid** — swap `Resend` for `@sendgrid/mail`; rest of the flow is identical
- **Gmail API (send-as partner)** — requires OAuth2 per partner, significantly more setup; defer until needed

## Deploy

```bash
# First time only
npm install -g firebase-tools
firebase login
firebase use --add

# Install function deps
cd functions && npm install && cd ..

# Set the Resend secret
firebase functions:secrets:set RESEND_API_KEY

# Deploy hosting + functions together
firebase deploy

# Or just one
firebase deploy --only hosting
firebase deploy --only functions
```

## Testing locally

```bash
firebase emulators:start
# Partners portal: http://localhost:5000
# Functions:      http://localhost:5001
```

## Extending

**Hook up the Solution Builder → Proposal flow:**
Capture selected cards in `sessionStorage`, pre-populate form fields on the Proposal Builder.

**Add a partner pipeline view:**
Read from the `proposals_sent` Firestore collection, filter by logged-in partner.

**Auth gating:**
The Cloud Function has a `TODO` for Firebase Auth ID token verification. Uncomment once Firebase Auth is wired on the frontend.

## Brand Colors

| Variable | Hex | Usage |
|---|---|---|
| `--dark-gray` | `#353D4A` | Headings, body, nav active |
| `--med-gray` | `#7A7F88` | Labels, secondary text |
| `--dark-green` | `#00827C` | CTA, active indicator, badges, "Next Step" |
| `--med-green` | `#00A398` | Bullet dots, section underlines, tag borders |
| `--tint-dark` | `#E0F4F3` | Fills |
| `--tint-light` | `#F0FAF9` | Soft backgrounds |

All colors applied identically in the generated PDF (see `C` palette constant in `proposal-pdf.js`).


