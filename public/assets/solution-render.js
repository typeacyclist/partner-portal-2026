// ========================================================================
// Solution Builder Renderer
// ========================================================================
// Reads window.SOLUTION_CONTENT (defined in solution-content.js) and
// renders cards into #cards-mount on the solution-builder page.
//
// For each card, conditionally renders three asset icons:
//   - Technical Report  (document icon)  → Firebase Storage file
//   - Infographic       (image icon)     → Firebase Storage file
//   - Explainer Video   (play icon)      → Vimeo URL
//
// Missing assets are hidden (no greyed-out "coming soon" state).
//
// Firebase Storage paths get resolved to download URLs on click. We could
// resolve them up-front at render time, but that triggers N Storage lookups
// per page load. Lazy resolution on click is faster and uses fewer requests.

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
  solutions: { tag: 'SOLUTION',   className: 'tag tag-solid' },
  useCases:  { tag: 'USE CASE',   className: 'tag' },
  products:  { tag: 'PRODUCT',    className: 'tag' },
  buyers:    { tag: 'IDEAL BUYER', className: 'tag' }
};

const TYPE_FILTER_KEY = {
  solutions: 'solution',
  useCases:  'usecase',
  products:  'product',
  buyers:    'buyer'
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

/** Renders the asset icon row; returns empty string if no assets present. */
function renderAssetRow(card) {
  const parts = [];

  if (card.technicalReport) {
    parts.push(
      `<a href="#" class="asset-icon" title="Technical Report"
         data-asset-type="storage" data-asset-path="${escapeHtml(card.technicalReport)}"
         data-asset-kind="report">${ICON_REPORT}<span>Report</span></a>`
    );
  }
  if (card.infographic) {
    parts.push(
      `<a href="#" class="asset-icon" title="Infographic"
         data-asset-type="storage" data-asset-path="${escapeHtml(card.infographic)}"
         data-asset-kind="infographic">${ICON_INFOGRAPHIC}<span>Infographic</span></a>`
    );
  }
  if (card.vimeoUrl) {
    parts.push(
      `<a href="${escapeHtml(card.vimeoUrl)}" target="_blank" rel="noopener"
         class="asset-icon" title="Explainer Video">${ICON_VIDEO}<span>Video</span></a>`
    );
  }

  if (parts.length === 0) return '';
  return `<div class="asset-row">${parts.join('')}</div>`;
}

function renderTag(tag, variant) {
  const cls = variant === 'gray' ? 'tag tag-gray' : 'tag';
  return `<span class="${cls}">${escapeHtml(tag)}</span>`;
}

function renderCard(card, typeKey) {
  const meta = TYPE_LABELS[typeKey];
  const filterKey = TYPE_FILTER_KEY[typeKey];
  const tags = (card.tags || []).map(t => renderTag(t, typeKey === 'products' ? null : (typeKey === 'useCases' ? 'gray' : null))).join('');
  const moreInfo = card.moreInfoUrl && card.moreInfoUrl !== '#'
    ? `<a href="${escapeHtml(card.moreInfoUrl)}" class="link-arrow">More Info →</a>`
    : '';
  const assetRow = renderAssetRow(card);

  return `
    <div class="card" data-solution-card data-type="${filterKey}">
      <span class="${meta.className}">${meta.tag}</span>
      <h3>${escapeHtml(card.title)}</h3>
      <p>${escapeHtml(card.description)}</p>
      ${tags ? `<div class="card-tags">${tags}</div>` : ''}
      ${moreInfo ? `<div class="card-more">${moreInfo}</div>` : ''}
      ${assetRow}
    </div>`;
}

function renderAllCards() {
  const mount = document.getElementById('cards-mount');
  if (!mount) return;
  const content = window.SOLUTION_CONTENT;
  if (!content) {
    console.error('[Solution Builder] solution-content.js did not load');
    return;
  }

  const html = [];
  for (const typeKey of ['solutions', 'useCases', 'products', 'buyers']) {
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
    console.error('[Solution Builder] Asset load failed:', err);
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
