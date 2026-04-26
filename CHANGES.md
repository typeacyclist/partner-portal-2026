# Remove Compare page and all references

Compare page deleted. All nav, footer, and cross-page links pointing
to it have been removed. `/compare` will 404 going forward (per your
decision — no redirect).

## Files in this bundle

| Bundle file | Repo destination | Action |
|---|---|---|
| `public/grc-one.html` | `public/grc-one.html` | overwrite |
| `public/assets/header.js` | `public/assets/header.js` | overwrite |
| `public/assets/footer.js` | `public/assets/footer.js` | overwrite |
| (no file) | `public/compare.html` | **DELETE in your repo** |

The bundle does not (and cannot) "carry" a deletion. You need to run
`git rm public/compare.html` in your repo manually — see deploy
commands below.

## What changed

### Deleted
- `public/compare.html` — page file removed entirely.

### `public/assets/header.js`
- Removed Compare from `NAV_ITEMS` (primary nav)
- Removed Compare from `DRAWER_ITEMS` (mobile drawer)

Final primary nav: **GRC One / Discover / Proposal Builder / Demos / GTM Playbook / Resources** + [New Proposal] button. 6 items, back to comfortable density.

### `public/assets/footer.js`
- Confirmed Compare is absent from the Selling Tools column.
  (Was already absent in this working tree — the standalone "add
  Compare to footer" delta from earlier never got merged into v10.
  No action needed in repo if your deployed footer.js doesn't have
  Compare; if it does, this overwrite removes it.)

### `public/grc-one.html`
- Removed the "vector reconciliation note" paragraph above the 11
  exposure category grid that linked to Compare.
- Removed the `.vector-note` CSS rule (now orphaned).
- Trimmed the Next Step panel: dropped the "Open Compare →" button and
  simplified the prose to focus on Discover only.
- Updated a stale CSS comment that mentioned Compare.

## What didn't change

- `firebase.json` — no redirect added (per your decision)
- 11 exposure categories on the GRC One page
- `solution-content.js` — no card data referenced Compare

## Deploy

Run **all four** commands. The `git rm` is the one that handles the
deletion — `git add` doesn't notice deleted files unless you use
`-A` or `--all`.

```powershell
git rm public/compare.html
git add public/grc-one.html public/assets/header.js public/assets/footer.js
git commit -m "Remove Compare page and all references"
git push origin main
```

Verify after deploy:

```powershell
curl https://trendzact-partners-001.web.app/compare
# Expect 404

curl https://trendzact-partners-001.web.app/assets/header.js | Select-String "compare"
# Expect zero matches

curl https://trendzact-partners-001.web.app/grc-one | Select-String "compare"
# Expect zero matches
```

## Browser cache caveat

`header.js` and `footer.js` are cached for 7 days
(`Cache-Control: max-age=604800`). Partners on existing tabs may still
see Compare in the nav until they hard-refresh (Ctrl+Shift+R) or
their cache expires.
