# Editing Solution Builder Content

The Solution Builder page on the Partners Portal displays cards for Solutions, Use Cases, Products, and Ideal Buyers. All card content lives in a single file so anyone comfortable editing text can update it without touching HTML.

## The one file you edit

`public/assets/solution-content.js`

That's it. Every card, every description, every link — all in that file.

## Structure

Four arrays, one per card type:

```js
window.SOLUTION_CONTENT = {
  solutions: [ /* cards that show as "SOLUTION" */ ],
  useCases:  [ /* cards that show as "USE CASE" */ ],
  products:  [ /* cards that show as "PRODUCT" */ ],
  buyers:    [ /* cards that show as "IDEAL BUYER" */ ]
};
```

Each card is an object with these fields:

| Field | Required? | What it is |
|---|---|---|
| `id` | yes | Short unique identifier (e.g. `insider-risk`). Letters, numbers, dashes only. |
| `title` | yes | The card heading. Keep it short — 2-5 words typically. |
| `description` | yes | 1-3 sentences describing the card. |
| `tags` | no | Array of strings shown as small chips. 2-4 items looks best. |
| `moreInfoUrl` | no | URL for the "More Info →" link at the bottom. Use `'#'` to hide the link. |
| `technicalReport` | no | Firebase Storage filename (e.g. `reports/insider-risk.pdf`) OR a full `https://` URL. |
| `infographic` | no | Same format as `technicalReport`. |
| `vimeoUrl` | no | Full Vimeo URL for the explainer video icon. |

**Missing asset fields → the icon for that asset simply doesn't render.** No placeholder, no grey button — clean cards with only the icons that have content.

## Adding a new card

1. Find the right array (solutions, useCases, products, or buyers)
2. Copy an existing card block including the surrounding `{` and `},`
3. Paste it at the end of the array, just before the closing `]`
4. Edit the values
5. Save and refresh the Solution Builder page

```js
// Example: adding a new use case
useCases: [
  // ... existing cases ...
  {
    id: 'shadow-it-detection',
    title: 'Shadow IT Detection',
    description: 'Identify unauthorized SaaS usage and unmanaged device activity across distributed workforces.',
    tags: ['ITM', 'Behavior Analytics'],
    moreInfoUrl: '#',
    technicalReport: 'reports/shadow-it-detection.pdf',
    vimeoUrl: 'https://vimeo.com/1234567890'
    // No infographic → that icon will just not appear on this card
  }
]
```

## Updating a card

Find the card by its `id` field, edit the values, save, refresh.

## Removing a card

Delete the entire `{ ... }` block **including the trailing comma** if there is one.

## Syntax traps to avoid

JavaScript object syntax is strict. The top three mistakes:

1. **Missing or extra commas between cards** — every card needs a `,` after the closing `}` except the last one in its array
2. **Unclosed strings** — especially if a description contains an apostrophe. Use either `'text'` with escaped apostrophes (`'don\'t'`) or `"text with apostrophes"`
3. **Forgetting the comma between fields** — every field ends with a comma except the last one in its card

**How to test:** open `https://trendzact-partners-001.web.app/solution-builder` in a browser, open DevTools (F12) → Console. Syntax errors show up immediately with a line number.

## Uploading assets to Firebase Storage

When you have a new PDF report or infographic:

1. Go to https://console.firebase.google.com/project/trendzact-partners-001/storage
2. Click **Upload file**
3. Optionally, create subfolders like `reports/` or `infographics/` first for organization
4. After upload, note the full path (e.g. `reports/insider-risk-technical-brief.pdf`)
5. Paste that path into the `technicalReport` or `infographic` field of the card
6. Save and refresh

## Access control

Storage files require authentication — only signed-in partners can open the links. This is set by the Firebase Storage security rules (`storage.rules` in the repo, if present). If you want some files to be public (e.g. a teaser video on an unauthenticated page), we'd need to adjust those rules.

## What happens on the page

1. Browser loads `solution-builder.html`
2. Browser loads `solution-content.js` (defines `window.SOLUTION_CONTENT`)
3. Browser loads `solution-render.js` (reads the content, builds the cards, injects into the page)
4. User clicks a report/infographic icon → render script fetches a signed download URL from Firebase Storage → opens it in a new tab
5. User clicks video icon → opens Vimeo URL directly in a new tab

Step 4 only works for signed-in users. Anonymous visitors get an alert.

## Debugging

If the page shows "Loading cards…" and never renders:

1. Open DevTools Console
2. Look for red errors — usually a syntax error in `solution-content.js`
3. The error message will say which line number

If cards render but an asset icon doesn't work:

1. Check that the file actually exists in Firebase Storage (console.firebase.google.com/project/.../storage)
2. Check the path exactly matches — case-sensitive, no leading slash
3. For Vimeo: make sure the URL starts with `https://vimeo.com/`

If nothing renders and no errors appear, hard-refresh (Ctrl+Shift+R). Browser cache is usually the culprit.
