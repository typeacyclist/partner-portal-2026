// ========================================================================
// Products Page Renderer
// ========================================================================
// Reads window.SOLUTION_CONTENT.products (defined in solution-content.js)
// and renders product cards into #products-mount on /products.html.
//
// Cards are grouped by category — CORE first, then MODULE, then ENHANCE.
// Each card shows:
//   - Category pill tag at top
//   - Title (h3)
//   - One-line summary
//   - Key Capabilities bullets (left column)
//   - Business Outcomes bullets (right column)
//   - Asset icon row (Report/Infographic/Video) — same green styling
//     and hide-when-missing logic as the Solution Builder.
//
// Asset Storage URLs are resolved on click (same pattern as solution-render.js)
// so we don't make N storage requests per page load.
// ========================================================================

import {
  getStorage,
  ref as storageRef,
  getDownloadURL
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js';

// Reuse the same icons from the Solution Builder for visual consistency
const ICON_REPORT = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="14" y2="17"/></svg>`;
const ICON_INFOGRAPHIC = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
const ICON_VIDEO = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;

const CATEGORY_ORDER = ['CORE', 'MODULE', 'ENHANCE'];
const CATEGORY_LABELS = {
  CORE:    { label: 'CORE',    className: 'tag tag-solid' },
  MODULE:  { label: 'MODULE',  className: 'tag' },
  ENHANCE: { label: 'ENHANCE', className: 'tag' }
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

/** Render a bulleted list. Returns empty string if list is empty/missing. */
function renderBullets(items) {
  if (!items || !items.length) return '';
  return `<ul class="check-list">${
    items.map(it => `<li>${escapeHtml(it)}</li>`).join('')
  }</ul>`;
}

/** Asset icon row — same shape as Solution Builder. Empty if no assets. */
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

function renderProductCard(card) {
  const cat = (card.category || 'MODULE').toUpperCase();
  const tagClass = CATEGORY_LABELS[cat]?.className || 'tag';
  const safeId = escapeHtml(card.id);

  return `
    <article class="product-card" id="${safeId}">
      <div class="product-card-head">
        <span class="${tagClass}">${escapeHtml(cat)}</span>
        <h3>${escapeHtml(card.title)}</h3>
        ${card.summary ? `<p class="product-summary">${escapeHtml(card.summary)}</p>` : ''}
      </div>

      <div class="product-card-body">
        <div class="product-col">
          <h4>Key Capabilities</h4>
          ${renderBullets(card.capabilities)}
        </div>
        <div class="product-col">
          <h4>Business Outcomes</h4>
          ${renderBullets(card.outcomes)}
        </div>
      </div>

      ${renderAssetRow(card)}
    </article>`;
}

function renderCategoryGroup(category, cards) {
  if (!cards.length) return '';
  const meta = CATEGORY_LABELS[category] || { label: category };
  return `
    <section class="product-category">
      <h2 class="product-category-title">${escapeHtml(meta.label)}</h2>
      <div class="product-grid">
        ${cards.map(renderProductCard).join('\n')}
      </div>
    </section>`;
}

function renderAllProducts() {
  const mount = document.getElementById('products-mount');
  if (!mount) return;
  const products = window.SOLUTION_CONTENT?.products;
  if (!products) {
    console.error('[Products] solution-content.js did not load');
    mount.innerHTML = '<p style="color:var(--med-gray);">Could not load product content.</p>';
    return;
  }

  // Group products by category
  const grouped = { CORE: [], MODULE: [], ENHANCE: [] };
  for (const p of products) {
    const cat = (p.category || 'MODULE').toUpperCase();
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
  }

  const html = CATEGORY_ORDER
    .map(cat => renderCategoryGroup(cat, grouped[cat] || []))
    .filter(Boolean)
    .join('\n');

  mount.innerHTML = html;
}

// ----------------------------------------------------------------------
// Asset click handler — same as Solution Builder
// ----------------------------------------------------------------------
async function handleAssetClick(e) {
  const link = e.target.closest('[data-asset-type="storage"]');
  if (!link) return;
  e.preventDefault();

  const path = link.dataset.assetPath;
  const kind = link.dataset.assetKind;
  if (!path) return;

  if (isHttpUrl(path)) {
    window.open(path, '_blank', 'noopener');
    return;
  }

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
    console.error('[Products] Asset load failed:', err);
    alert(`Could not load ${kind || 'asset'}. The file may not be available yet.`);
  } finally {
    link.innerHTML = originalHtml;
    link.style.pointerEvents = '';
  }
}

// ----------------------------------------------------------------------
// Init
// ----------------------------------------------------------------------
function init() {
  renderAllProducts();
  document.addEventListener('click', handleAssetClick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
