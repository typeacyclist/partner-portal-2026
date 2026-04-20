# Partners Portal v2 — Proposal Builder Update

This package adds a new `/proposal` page implementing the Track D 4-step wizard with the v6 39-SKU catalog, formula-based pricing, Firestore draft persistence, and jsPDF rendering. It also retires the old `/proposal-builder.html` and updates all internal links to point at `/proposal`.

## Pre-deploy checklist

Before merging, verify in the Firebase console:

1. **Firestore is enabled.** The wizard writes drafts to `users/{uid}/activeProposal/current`. If Firestore isn't initialized in the project, enable it (Native mode, default region).
2. **Firestore rules permit user writes to their own doc.** A minimal rule that works:
   ```
   match /users/{userId}/{document=**} {
     allow read, write: if request.auth != null && request.auth.uid == userId;
   }
   ```
3. **`proposal.html` is reachable at `/proposal`.** This works automatically via `firebase.json`'s `cleanUrls: true` setting — no rewrite changes needed.

## File operations

### NEW files (5)

Drop these into the repo at the indicated paths:

| File | Path in repo |
|---|---|
| `catalog.json` | `public/catalog.json` |
| `proposal.html` | `public/proposal.html` |
| `proposal-math.js` | `public/assets/proposal-math.js` |
| `proposal-render.js` | `public/assets/proposal-render.js` |
| `proposal-wizard.js` | `public/assets/proposal-wizard.js` |

### REPLACED files (5)

These are in the same paths in the repo. Overwrite with the versions in this package:

| File | Path in repo | What changed |
|---|---|---|
| `index.html` | `public/index.html` | quick-list link 02 + tile 03 link → `/proposal` |
| `solution-builder.html` | `public/solution-builder.html` | 2 CTA links → `/proposal` |
| `header.js` | `public/assets/header.js` | nav `Proposal` → `/proposal`, drawer entry → `/proposal`, top-right CTA renamed `New Proposal` → `/proposal` |
| `footer.js` | `public/assets/footer.js` | Selling Tools `Proposal Builder` → `/proposal` |
| `styles.css` | `public/assets/styles.css` | appended ~480 lines of `wiz-*` styles for the wizard (stepper, SKU cards, badges, totals card, line-item table, render states, resume modal). All other styles unchanged. |

### DELETED files (2)

Remove these from the repo:

```bash
git rm public/proposal-builder.html
git rm public/assets/proposal-pdf.js
```

The `sendProposal` Cloud Function in `functions/index.js` is **not deleted** — it stays for future email integration but isn't called by the v1 wizard.

## What `/proposal` does

A 4-step wizard at `/proposal`:

1. **Opportunity** — company, contact, use case, deal stage, close date, segment (8 options), licensed users, contract length (1/2/3 yr).
2. **Modules & Add-Ons** — interactive SKU selection. Always-included summary at top (CORE/CARE/INIT-ONBRD). Modules grid with badges (REQUIRED blue, BETA amber/disabled, NEW GA green). Selecting a module reveals nested option cards (ARCH for any module, CONN-TEAMS/ZOOM/WEBEX/GMEET for SVM, CONN-PURVIEW for eDLP/MSR/ITM, etc.). Platform Options and One-Time Setup sections below.
3. **Review & Calculate** — full pricing breakdown: meta table (segment, bracket, multiplier), totals card showing Y1, bundle discount, recurring vs one-time, Y2/Y3 with continuity, TCV. Line-items table. Notes textarea.
4. **Render** — confirmation modal, then jsPDF generates a 3-page PDF (cover with Y1 hero, scope & pricing table, next-steps page). Filename `trendzact-proposal-{slug}-{TZ-XXXXXXXX}.pdf`. Firestore draft cleared on success.

### Pricing engine

- **License brackets** (volume): 1.20× (1–100) / 1.00× (101–500) / 0.85× (501–2500) / 0.70× (2501+)
- **Bundle discount** (formula): `min(45%, max(0, (n - 2 + 1) × 15%))` where `n` = count of selected eligible modules. Hits the 45% cap at 4 modules.
- **Multi-year continuity**: Year 2 = 85% of Y1 recurring, Year 3 = 70% of Y1 recurring.
- **CARE & INIT-ONBRD**: scale by company segment multiplier (`careMultiplier` × $20K base; `presaleMultiplier` × $25K base).
- **BETA SKUs**: visible in cards with amber badge, checkbox disabled, never count toward bundle, no pricing.

### Draft persistence

- Autosave fires 1500ms after the last edit
- Firestore path: `users/{uid}/activeProposal/current`
- Resume-or-fresh modal shows on revisit when a draft exists
- Successful PDF render clears the draft doc

### Auth

The wizard waits for the existing `trendzact-auth-ready` event from `auth.js` before booting. If auth fails (no user, network issue), it shows a fatal-error message in the wizard mount. There's a 3-second fallback to boot anyway in case the event never fires (helpful for local dev with auth disabled).

## How to deploy

After staging the file operations:

```bash
git add public/catalog.json public/proposal.html public/assets/proposal-math.js public/assets/proposal-render.js public/assets/proposal-wizard.js
git add public/index.html public/solution-builder.html public/assets/header.js public/assets/footer.js public/assets/styles.css
git rm public/proposal-builder.html public/assets/proposal-pdf.js
git commit -m "Add /proposal wizard with v6 catalog, retire proposal-builder.html"
git push
```

The existing `.github/workflows/firebase-deploy.yml` will handle deployment automatically — preview channel for the PR, production deploy on merge to `main`.

## Smoke test (after deploy)

1. Sign in to the portal.
2. Click **New Proposal** in the top right (or `Proposal` in the nav).
3. Fill in company name, set users to 500, leave segment Core Mid-Market, contract 1 year. Click **Next**.
4. Check SWA, eDLP, ITM, SVM. Should see CONN-TEAMS option appear nested under SVM. Click **Next**.
5. Review page should show: Y1 = $235,000 (with 4-module 45% bundle discount of $135,000). Click **Render Proposal →**, confirm.
6. PDF downloads to your Downloads folder.
7. Reload `/proposal` — should see "Continue where you left off?" modal with no in-progress draft (since render cleared it).
8. Open browser DevTools → Network — confirm `catalog.json` is fetched once with `Cache-Control: no-cache`.
9. Open Firestore console — `users/{your-uid}/activeProposal/current` should not exist after a successful render (got cleared).

## Known limitations (v1)

- **No multi-tenant `orgId`** — drafts live at `users/{uid}/activeProposal/current`. When multi-tenant Identity Platform tenants come online, refactor to `orgs/{orgId}/users/{uid}/activeProposal/current`.
- **No catalog lint script** — the `_readme` block in `catalog.json` documents invariants; a Node lint script per the spec is deferred.
- **No email-from-wizard** — v1 is download-only. The `sendProposal` Cloud Function remains in the repo and can be re-wired later.
- **No past-proposals archive** — render generates and downloads, then clears the draft. No server-side log of generated proposals (Firestore `proposals_sent` collection is only written by the unused `sendProposal` function).
- **Per-SKU quantity overrides** (e.g., for PRIVSCR cartons in old hardware-based pricing) not in v1 — PRIVSCR is now per-user, no override needed.
- **No tax / non-USD / promo codes** — deferred to v2.
- **`app.js` still has dead code** for the old `#proposalForm` live-pricing widget. It safely no-ops on `/proposal` since those IDs don't exist there. Cleaning it up is optional; safe to leave.

## Files in this package

```
public/
├── catalog.json                    NEW  (39 SKUs, v6)
├── index.html                      MOD  (2 link updates)
├── proposal.html                   NEW  (wizard shell)
├── solution-builder.html           MOD  (2 link updates)
└── assets/
    ├── footer.js                   MOD  (1 link update)
    ├── header.js                   MOD  (3 link/label updates)
    ├── proposal-math.js            NEW  (math engine)
    ├── proposal-render.js          NEW  (PDF renderer)
    ├── proposal-wizard.js          NEW  (4-step wizard)
    └── styles.css                  MOD  (~480 lines appended)

DELETED (not in this package):
├── public/proposal-builder.html
└── public/assets/proposal-pdf.js
```
