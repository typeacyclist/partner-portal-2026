// ========================================================================
// Discover Page Renderer
// ========================================================================
// Reads window.SOLUTION_CONTENT (defined in solution-content.js) and
// renders cards into #cards-mount on the /discover page.
//
// For each card, always renders three asset links plus a visual card icon:
//   - Details      (document icon)  → Firebase Storage file
//   - Infographic  (image icon)     → Firebase Storage file
//   - Explainer Video (play icon)   → Vimeo URL
//   - Card icon     (image)          → Firebase Storage file / URL
//
// Firebase Storage paths get resolved to download URLs on click for assets
// and lazily after render for card icons.

import {
  getStorage,
  ref as storageRef,
  getDownloadURL
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js';

const DEFAULT_CARD_ICON = 'gs://trendzact-partners-001.firebasestorage.app/icons/Trendzact Favicon (green).png';

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

function getCardIconPath(card) {
  return card.iconImage || card.cardIcon || card.iconUrl || DEFAULT_CARD_ICON;
}

function renderCardIcon(card) {
  const iconPath = getCardIconPath(card);
  const alt = card.iconAlt || `${card.title || 'Discover card'} icon`;

  return `
      <div class="card-icon-wrap" aria-hidden="false">
        <div class="card-icon-placeholder" aria-hidden="true">TZ</div>
        <img class="card-icon-img" alt="${escapeHtml(alt)}" data-card-icon-path="${escapeHtml(iconPath)}" loading="lazy" hidden />
      </div>`;
}

function renderCardTypeRow(meta) {
  return `
      <div class="card-type-row">
        <span class="${meta.className}">${meta.tag}</span>
      </div>`;
}

async function resolveCardIcons() {
  const images = Array.from(document.querySelectorAll('img[data-card-icon-path]'));
  if (!images.length) return;

  let storage = null;
  if (window.TrendzactAuth && window.TrendzactAuth.app) {
    storage = getStorage(window.TrendzactAuth.app);
  }

  await Promise.all(images.map(async img => {
    const path = img.dataset.cardIconPath;
    if (!path) return;

    try {
      let src = path;
      if (!isHttpUrl(path)) {
        if (!storage) return;
        src = await getDownloadURL(storageRef(storage, path));
      }

      img.src = src;
      img.hidden = false;
      const wrapper = img.closest('.card-icon-wrap');
      if (wrapper) wrapper.classList.add('has-image');
    } catch (err) {
      console.warn('[Discover] Card icon load failed:', path, err);
    }
  }));
}

function renderAssetRow(card) {
  const parts = [];

  parts.push(renderAssetIcon({
    value: card.technicalReport,
    title: 'Details',
    label: 'Details',
    icon: ICON_REPORT,
    kind: 'details',
    isExternal: false
  }));

  parts.push(renderAssetIcon({
    value: card.infographic,
    title: 'Infographic',
    label: 'Infographic',
    icon: ICON_INFOGRAPHIC,
    kind: 'infographic',
    isExternal: false
  }));

  parts.push(renderAssetIcon({
    value: card.vimeoUrl,
    title: 'Explainer Video',
    label: 'Video',
    icon: ICON_VIDEO,
    kind: 'video',
    isExternal: true
  }));

  parts.push(renderCardIcon(card));

  return `<div class="asset-row">${parts.join('')}</div>`;
}

function renderAssetIcon({ value, title, label, icon, kind, isExternal }) {
  const isPlaceholder = !value || value === '#';

  if (isPlaceholder) {
    return `<span class="asset-icon asset-icon-disabled" title="${escapeHtml(title)} (coming soon)" aria-disabled="true">${icon}<span>${escapeHtml(label)}</span></span>`;
  }

  if (isExternal) {
    return `<a href="${escapeHtml(value)}" target="_blank" rel="noopener" class="asset-icon" title="${escapeHtml(title)}">${icon}<span>${escapeHtml(label)}</span></a>`;
  }

  return `<a href="#" class="asset-icon" title="${escapeHtml(title)}" data-asset-type="storage" data-asset-path="${escapeHtml(value)}" data-asset-kind="${escapeHtml(kind)}">${icon}<span>${escapeHtml(label)}</span></a>`;
}

function renderBullets(items) {
  if (!items || !items.length) return '';
  return `<ul class="check-list">${
    items.map(it => `<li>${escapeHtml(it)}</li>`).join('')
  }</ul>`;
}

const VECTOR_TAG_SET = new Set([
  'visibility', 'presence', 'environment', 'behavior',
  'context', 'continuity', 'evidence', 'control'
]);

function splitTags(rawTags) {
  const moduleTags = [];
  const vectorTags = [];
  for (const t of (rawTags || [])) {
    if (typeof t !== 'string') continue;
    if (t.startsWith('primary:')) continue;
    if (VECTOR_TAG_SET.has(t.toLowerCase())) {
      vectorTags.push(t);
    } else {
      moduleTags.push(t);
    }
  }
  return { moduleTags, vectorTags };
}

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
        ${renderCardTypeRow(meta)}
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
  const summaryText = card.summary || card.description || '';

  return `
    <div class="card sb-unified-card" id="${escapeHtml(card.id || '')}" data-solution-card data-type="${filterKey}">
      ${renderCardTypeRow(meta)}
      <h3>${escapeHtml(card.title)}</h3>
      ${summaryText ? `<p class="card-summary">${escapeHtml(summaryText)}</p>` : ''}
      ${tagsHtml ? `<div class="card-tags">${tagsHtml}</div>` : ''}
      ${vectorTagsHtml}
      ${card.bullets && card.bullets.length ? `<div class="card-bullets">${renderBullets(card.bullets)}</div>` : ''}
      ${assetRow}
    </div>`;
}

function renderCard(card, typeKey) {
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
    console.error('[Discover] Asset load failed:', err);
    alert(`Could not load ${kind || 'asset'}. The file may not be available yet.`);
  } finally {
    link.innerHTML = originalHtml;
    link.style.pointerEvents = '';
  }
}

function init() {
  renderAllCards();
  resolveCardIcons();
  setTimeout(resolveCardIcons, 300);
  document.addEventListener('click', handleAssetClick);
  document.dispatchEvent(new CustomEvent('solution-cards-rendered'));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
