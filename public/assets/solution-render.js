// ========================================================================
// Discover Page Renderer
// ========================================================================
// Reads window.SOLUTION_CONTENT (defined in solution-content.js) and
// renders cards into #cards-mount on the /discover page.
//
// For each card, always renders three asset icons (consistent layout):
//   - Details      (document icon)  → Firebase Storage file
//   - Infographic  (image icon)     → Firebase Storage file
//   - Explainer Video (play icon)   → Vimeo URL
//
// When a card's value is '#' (placeholder), the icon renders disabled
// instead of being hidden — keeps the asset row visually consistent
// across all cards even before real assets are uploaded.
//
// Firebase Storage paths get resolved to download URLs on click. We could
// resolve them up-front at render time, but that triggers N Storage lookups
// per page load. Lazy resolution on click is faster and uses fewer requests.
//
// Exposure Vector cards (formerly Products) render the two-column layout
// with Key Capabilities + Business Outcomes bullets. All other card
// types (solutions, use cases, case studies, buyers) render the compact
// unified shape: badge / title / summary / chips / bullets / asset row.

import {
  getStorage,
  ref as storageRef,
  getDownloadURL
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js';

// Inline SVG icons (kept tiny, brand-colored via currentColor)
const ICON_REPORT = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="14" y2="17"/></svg>`;
const ICON_INFOGRAPHIC = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
const ICON_VIDEO = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;

const TYPE_LABELS = {
  solutions:   { tag: 'SOLUTION',        className: 'tag tag-solid' },
  useCases:    { tag: 'USE CASE',        className: 'tag' },
  vectors:     { tag: 'EXPOSURE VECTOR', className: 'tag' },
  caseStudies: { tag: 'CASE STUDY',      className: 'tag tag-solid' },
  buyers:      { tag: 'IDEAL BUYER',     className: 'tag' }
};

const TYPE_FILTER_KEY = {
  solutions:   'solution',
  useCases:    'usecase',
  vectors:     'vector',
  caseStudies: 'casestudy',
  buyers:      'buyer'
};

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isHttpUrl(s) {
  return typeof s === 'string' && /^https?:\/\//i.test(s);
}

/** Renders the asset icon row.
 *  Always renders all three icons (Details / Infographic / Video).
 *  When a card's value is '#' (placeholder), the icon renders in a
 *  disabled state with no click handler — visually present so the card
 *  layout stays consistent, but obviously not actionable. */
function renderAssetRow(card) {
  const parts = [];

  // Details (formerly Report)
  parts.push(renderAssetIcon({
    value: card.technicalReport,
    title: 'Details',
    label: 'Details',
    icon: ICON_REPORT,
    kind: 'details',
    isExternal: false
  }));

  // Infographic
  parts.push(renderAssetIcon({
    value: card.infographic,
    title: 'Infographic',
    label: 'Infographic',
    icon: ICON_INFOGRAPHIC,
    kind: 'infographic',
    isExternal: false
  }));

  // Video (Vimeo URL — opens directly, no Storage lookup)
  parts.push(renderAssetIcon({
    value: card.vimeoUrl,
    title: 'Explainer Video',
    label: 'Video',
    icon: ICON_VIDEO,
    kind: 'video',
    isExternal: true
  }));

  return `<div class="asset-row">${parts.join('')}</div>`;
}

/** Renders one asset icon. Disabled state if value is missing or '#'. */
function renderAssetIcon({ value, title, label, icon, kind, isExternal }) {
  const isPlaceholder = !value || value === '#';

  if (isPlaceholder) {
    // Disabled — span instead of <a>, no click handler attached
    return `<span class="asset-icon asset-icon-disabled" title="${escapeHtml(title)} (coming soon)" aria-disabled="true">${icon}<span>${escapeHtml(label)}</span></span>`;
  }

  if (isExternal) {
    // External URL (e.g. Vimeo) — open directly
    return `<a href="${escapeHtml(value)}" target="_blank" rel="noopener" class="asset-icon" title="${escapeHtml(title)}">${icon}<span>${escapeHtml(label)}</span></a>`;
  }

  // Firebase Storage path — resolved on click
  return `<a href="#" class="asset-icon" title="${escapeHtml(title)}" data-asset-type="storage" data-asset-path="${escapeHtml(value)}" data-asset-kind="${escapeHtml(kind)}">${icon}<span>${escapeHtml(label)}</span></a>`;
}

/** Render a bulleted list. Returns empty string if list is empty/missing. */
function renderBullets(items) {
  if (!items || !items.length) return '';
  return `<ul class="check-list">${
    items.map(it => `<li>${escapeHtml(it)}</li>`).join('')
  }</ul>`;
}

// ------------------------------------------------------------------
// Tag classification
// ------------------------------------------------------------------
// The data file stores three kinds of strings inside each card's `tags` array:
//
//  1. Module/product tags  (e.g. 'Edge DLP', 'ITM', 'GRC1 Core')
//     → render as the normal chip below the title
//
//  2. Vector tags  (lowercase canonical names like 'visibility', 'presence')
//     → render in a separate, smaller, muted row underneath the module
//       chips, so partners can see which vectors a use case combines
//       without the row dominating the card visually
//
//  3. Structural metadata tags  (`primary:<vector>` on solutions)
//     → never rendered. They're metadata for code (e.g. for the future
//       "primary vector" badge or for the Compare table), not display
//
// VECTOR_TAG_SET defines the canonical lowercase vector tag values
// recognized as belonging to category 2.
const VECTOR_TAG_SET = new Set([
  'visibility', 'presence', 'environment', 'behavior',
  'context', 'continuity', 'evidence', 'control'
]);

/** Split a card's tags into module tags vs vector tags, dropping metadata. */
function splitTags(rawTags) {
  const moduleTags = [];
  const vectorTags = [];
  for (const t of (rawTags || [])) {
    if (typeof t !== 'string') continue;
    // Drop structural metadata like 'primary:behavior'
    if (t.startsWith('primary:')) continue;
    if (VECTOR_TAG_SET.has(t.toLowerCase())) {
      vectorTags.push(t);
    } else {
      moduleTags.push(t);
    }
  }
  return { moduleTags, vectorTags };
}

/** Render the smaller, muted row of vector chips. Empty string if none. */
function renderVectorTagRow(vectorTags) {
  if (!vectorTags.length) return '';
  const chips = vectorTags
    .map(v => `<span class="vector-chip">${escapeHtml(v)}</span>`)
    .join('');
  return `<div class="card-vector-tags" aria-label="Exposure vectors">${chips}</div>`;
}

function renderTag(tag, variant) {
  const cls = variant === 'gray' ? 'tag tag-gray' : 'tag';
  return `<span class="${cls}">${escapeHtml(tag)}</span>`;
}

/**
 * Two-column card with Key Capabilities + Business Outcomes bullets.
 * Originally built for the old Products page; now used for Exposure Vector
 * cards on Discover. CSS classes keep the `product-card` naming for
 * backward compatibility with styles.css; they describe layout, not
 * semantic card type.
 */
function renderProductStyleCard(card, typeKey) {
  const meta = TYPE_LABELS[typeKey];
  const filterKey = TYPE_FILTER_KEY[typeKey];
  const { moduleTags, vectorTags } = splitTags(card.tags);
  const tagsHtml = moduleTags.map(t => renderTag(t)).join('');
  const vectorTagsHtml = renderVectorTagRow(vectorTags);
  const hasBullets = (card.capabilities && card.capabilities.length) ||
                     (card.outcomes && card.outcomes.length);

  return `
    <article class="card product-card sb-product-card" id="${escapeHtml(card.id || '')}" data-solution-card data-type="${filterKey}" data-category="${escapeHtml((card.category || '').toUpperCase())}">
      <div class="product-card-head">
        <span class="${meta.className}">${meta.tag}</span>
        <h3>${escapeHtml(card.title)}</h3>
        ${card.summary ? `<p class="product-summary">${escapeHtml(card.summary)}</p>` : ''}
      </div>

      ${tagsHtml ? `<div class="card-tags">${tagsHtml}</div>` : ''}
      ${vectorTagsHtml}

      ${hasBullets ? `
      <div class="product-card-body">
        <div class="product-col">
          <h4>Key Capabilities</h4>
          ${renderBullets(card.capabilities)}
        </div>
        <div class="product-col">
          <h4>Business Outcomes</h4>
          ${renderBullets(card.outcomes)}
        </div>
      </div>` : ''}

      ${renderAssetRow(card)}
    </article>`;
}

function renderCompactCard(card, typeKey) {
  const meta = TYPE_LABELS[typeKey];
  const filterKey = TYPE_FILTER_KEY[typeKey];
  const { moduleTags, vectorTags } = splitTags(card.tags);
  const tagsHtml = moduleTags.map(t => renderTag(t, typeKey === 'useCases' ? 'gray' : null)).join('');
  const vectorTagsHtml = renderVectorTagRow(vectorTags);
  const assetRow = renderAssetRow(card);
  // Accept `summary` as the unified field; fall back to `description` for
  // backward compatibility with any card blocks that haven't been migrated.
  const summaryText = card.summary || card.description || '';

  return `
    <div class="card sb-unified-card" id="${escapeHtml(card.id || '')}" data-solution-card data-type="${filterKey}">
      <span class="${meta.className}">${meta.tag}</span>
      <h3>${escapeHtml(card.title)}</h3>
      ${summaryText ? `<p class="card-summary">${escapeHtml(summaryText)}</p>` : ''}
      ${tagsHtml ? `<div class="card-tags">${tagsHtml}</div>` : ''}
      ${vectorTagsHtml}
      ${card.bullets && card.bullets.length ? `<div class="card-bullets">${renderBullets(card.bullets)}</div>` : ''}
      ${assetRow}
    </div>`;
}

function renderCard(card, typeKey) {
  // Exposure Vector cards use the full two-column layout with Key Capabilities
  // + Business Outcomes bullets. All other types use the compact layout.
  if (typeKey === 'vectors') {
    return renderProductStyleCard(card, typeKey);
  }
  return renderCompactCard(card, typeKey);
}

function renderAllCards() {
  const mount = document.getElementById('cards-mount');
  if (!mount) return;
  const content = window.SOLUTION_CONTENT;
  if (!content) {
    console.error('[Discover] solution-content.js did not load');
    return;
  }

  const html = [];
  for (const typeKey of ['solutions', 'useCases', 'vectors', 'caseStudies', 'buyers']) {
    const items = content[typeKey] || [];
    for (const card of items) {
      html.push(renderCard(card, typeKey));
    }
  }
  mount.innerHTML = html.join('\n');
}

// ------------------------------------------------------------------
// Asset click handler — resolves Firebase Storage path to download URL
// ------------------------------------------------------------------
async function handleAssetClick(e) {
  const link = e.target.closest('[data-asset-type="storage"]');
  if (!link) return;
  e.preventDefault();

  const path = link.dataset.assetPath;
  const kind = link.dataset.assetKind;
  if (!path) return;

  // If it's already a full URL, just open it
  if (isHttpUrl(path)) {
    window.open(path, '_blank', 'noopener');
    return;
  }

  // Show loading state on the link
  const originalHtml = link.innerHTML;
  link.style.pointerEvents = 'none';
  link.innerHTML = `<span class="asset-spinner"></span><span>Loading…</span>`;

  try {
    if (!window.TrendzactAuth || !window.TrendzactAuth.app) {
      throw new Error('Firebase not initialized');
    }
    const storage = getStorage(window.TrendzactAuth.app);
    const fileRef = storageRef(storage, path);
    const url = await getDownloadURL(fileRef);
    window.open(url, '_blank', 'noopener');
  } catch (err) {
    console.error('[Discover] Asset load failed:', err);
    alert(`Could not load ${kind || 'asset'}. The file may not be available yet.`);
  } finally {
    link.innerHTML = originalHtml;
    link.style.pointerEvents = '';
  }
}

// ------------------------------------------------------------------
// Init — wait for auth so Storage reads are authenticated
// ------------------------------------------------------------------
function init() {
  renderAllCards();
  document.addEventListener('click', handleAssetClick);

  // Re-apply filter state if app.js already loaded
  // (app.js wires up the chips + search — it needs cards in the DOM to filter)
  document.dispatchEvent(new CustomEvent('solution-cards-rendered'));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
