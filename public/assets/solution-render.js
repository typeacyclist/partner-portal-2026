// ========================================================================
// Discover Page Renderer
// ========================================================================
// Reads window.SOLUTION_CONTENT and renders Solution Builder cards on /discover.
// Asset fields supported per card:
//   moreInfo, audioExplainer, summaryReports, infoGraphics, slideDecks, videoExplainers
// Asset behavior:
//   audio/video/image -> media player modal
//   reports/slides/pdf -> new tab
//   '#' or empty -> disabled gray icon
//   any non-# value -> active green icon
// ========================================================================

const DEFAULT_CARD_ICON = 'gs://trendzact-partners-001.firebasestorage.app/site_icons/Trendzact ai_shield icon 2026.jpg';

const ICON_MORE = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;
const ICON_AUDIO = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
const ICON_REPORT = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>`;
const ICON_GRAPHIC = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
const ICON_SLIDES = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 18v3"/><path d="M8 9h8"/><path d="M8 13h5"/></svg>`;
const ICON_VIDEO = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;

const TYPE_LABELS = {
  platform: { tag: 'PLATFORM', className: 'tag tag-solid' },
  solutions: { tag: 'SOLUTION', className: 'tag tag-solid' },
  enhancements: { tag: 'ENHANCEMENT', className: 'tag tag-solid' },
  useCases: { tag: 'USE CASE', className: 'tag' },
  vectors: { tag: 'EXPOSURE VECTOR', className: 'tag' },
  caseStudies: { tag: 'CASE STUDY', className: 'tag tag-solid' },
  buyers: { tag: 'IDEAL BUYER', className: 'tag' }
};

const TYPE_FILTER_KEY = {
  platform: 'platform',
  solutions: 'solution',
  enhancements: 'enhancement',
  useCases: 'usecase',
  vectors: 'vector',
  caseStudies: 'casestudy',
  buyers: 'buyer'
};

let storageModulePromise = null;
const FIREBASE_VERSION = '10.14.1';
const FIREBASE_STORAGE_MODULE_URL = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-storage.js`;

function loadStorageModule() {
  if (!storageModulePromise) storageModulePromise = import(FIREBASE_STORAGE_MODULE_URL);
  return storageModulePromise;
}

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

function isGsUrl(s) {
  return typeof s === 'string' && /^gs:\/\//i.test(s);
}

function objectPathFromGsUrl(value) {
  const clean = String(value || '').replace(/^gs:\/\//i, '');
  const slashIndex = clean.indexOf('/');
  return slashIndex >= 0 ? clean.slice(slashIndex + 1) : '';
}

function toFirebaseDownloadUrl(value) {
  if (!value || value === '#') return '#';
  if (isHttpUrl(value)) return value;

  const bucket = window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.storageBucket;
  if (!bucket) return value;

  const objectPath = isGsUrl(value) ? objectPathFromGsUrl(value) : String(value).replace(/^\/+/, '');
  return 'https://firebasestorage.googleapis.com/v0/b/' + encodeURIComponent(bucket) + '/o/' + encodeURIComponent(objectPath) + '?alt=media';
}

function cleanExt(value) {
  return String(value || '').split('?')[0].toLowerCase();
}

function mediaTypeForAsset(kind, value) {
  const lower = cleanExt(value);
  if (kind === 'audio' || lower.endsWith('.m4a') || lower.endsWith('.mp3') || lower.endsWith('.wav')) return 'audio';
  if (kind === 'video' || lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov')) return 'video';
  if (kind === 'graphic' || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp') || lower.endsWith('.gif')) return 'image';
  return '';
}

function shouldOpenInMediaPlayer(kind, value) {
  return Boolean(mediaTypeForAsset(kind, value));
}

function getCardIconPath(card) {
  return card.iconImage || card.cardIcon || card.iconUrl || DEFAULT_CARD_ICON;
}

function renderCardIcon(card) {
  const iconPath = getCardIconPath(card);
  const alt = card.iconAlt || `${card.title || 'Discover card'} icon`;
  return `<div class="card-icon-wrap" aria-hidden="false"><div class="card-icon-placeholder" aria-hidden="true">TZ</div><img class="card-icon-img" alt="${escapeHtml(alt)}" data-card-icon-path="${escapeHtml(iconPath)}" loading="lazy" hidden /></div>`;
}

function renderCardTypeRow(meta) {
  return `<div class="card-type-row"><span class="${meta.className}">${meta.tag}</span></div>`;
}

async function resolveCardIcons() {
  const images = Array.from(document.querySelectorAll('img[data-card-icon-path]'));
  if (!images.length) return;

  const storageApi = await loadStorageModule().catch(err => {
    console.warn('[Discover] Firebase Storage module failed to load:', err);
    return null;
  });
  if (!storageApi) return;

  let storage = null;
  if (window.TrendzactAuth && window.TrendzactAuth.app) {
    storage = storageApi.getStorage(window.TrendzactAuth.app);
  }

  await Promise.all(images.map(async img => {
    const path = img.dataset.cardIconPath;
    if (!path) return;

    try {
      let src = path;
      if (!isHttpUrl(path)) {
        if (isGsUrl(path) || path.indexOf('/') >= 0) {
          src = toFirebaseDownloadUrl(path);
        } else if (storage) {
          src = await storageApi.getDownloadURL(storageApi.ref(storage, path));
        }
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
  const assets = [
    { field: 'moreInfo', title: 'More Info', label: 'More', icon: ICON_MORE, kind: 'more' },
    { field: 'audioExplainer', title: 'Audio Explainer', label: 'Audio', icon: ICON_AUDIO, kind: 'audio' },
    { field: 'summaryReports', title: 'Summary Report', label: 'Report', icon: ICON_REPORT, kind: 'report' },
    { field: 'infoGraphics', title: 'Infographic', label: 'Graphic', icon: ICON_GRAPHIC, kind: 'graphic' },
    { field: 'slideDecks', title: 'Slide Deck', label: 'Slides', icon: ICON_SLIDES, kind: 'slides' },
    { field: 'videoExplainers', title: 'Video Explainer', label: 'Video', icon: ICON_VIDEO, kind: 'video' }
  ];

  const parts = assets.map(asset => renderAssetIcon({
    value: card[asset.field],
    title: asset.title,
    label: asset.label,
    icon: asset.icon,
    kind: asset.kind,
    mediaTitle: `${card.title || 'Asset'} - ${asset.label}`
  }));

  parts.push(renderCardIcon(card));
  return `<div class="asset-row">${parts.join('')}</div>`;
}

function renderAssetIcon({ value, title, label, icon, kind, mediaTitle }) {
  const isPlaceholder = !value || value === '#';
  if (isPlaceholder) {
    return `<span class="asset-icon asset-icon-disabled" title="${escapeHtml(title)} (coming soon)" aria-disabled="true">${icon}<span>${escapeHtml(label)}</span></span>`;
  }

  const url = toFirebaseDownloadUrl(value);
  const mediaType = mediaTypeForAsset(kind, value);

  if (shouldOpenInMediaPlayer(kind, value)) {
    return `<a href="${escapeHtml(url)}" class="asset-icon asset-icon-active" title="${escapeHtml(title)}" data-media-player data-media-title="${escapeHtml(mediaTitle)}" data-media-src="${escapeHtml(value)}" data-media-type="${escapeHtml(mediaType)}">${icon}<span>${escapeHtml(label)}</span></a>`;
  }

  return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener" class="asset-icon asset-icon-active" title="${escapeHtml(title)}">${icon}<span>${escapeHtml(label)}</span></a>`;
}

function renderBullets(items) {
  if (!items || !items.length) return '';
  return `<ul class="check-list">${items.map(it => `<li>${escapeHtml(it)}</li>`).join('')}</ul>`;
}

const VECTOR_TAG_SET = new Set(['visibility', 'presence', 'environment', 'behavior', 'context', 'continuity', 'evidence', 'control']);

function splitTags(rawTags) {
  const moduleTags = [];
  const vectorTags = [];
  for (const t of (rawTags || [])) {
    if (typeof t !== 'string') continue;
    if (t.startsWith('primary:')) continue;
    if (VECTOR_TAG_SET.has(t.toLowerCase())) vectorTags.push(t);
    else moduleTags.push(t);
  }
  return { moduleTags, vectorTags };
}

function renderVectorTagRow(vectorTags) {
  if (!vectorTags.length) return '';
  const chips = vectorTags.map(v => `<span class="vector-chip">${escapeHtml(v)}</span>`).join('');
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
  const hasBullets = (card.capabilities && card.capabilities.length) || (card.outcomes && card.outcomes.length);

  return `<article class="card product-card sb-product-card" id="${escapeHtml(card.id || '')}" data-solution-card data-type="${filterKey}" data-category="${escapeHtml((card.category || '').toUpperCase())}">
      <div class="product-card-head">
        ${renderCardTypeRow(meta)}
        <h3>${escapeHtml(card.title)}</h3>
        ${card.summary ? `<p class="product-summary">${escapeHtml(card.summary)}</p>` : ''}
      </div>
      ${tagsHtml ? `<div class="card-tags">${tagsHtml}</div>` : ''}
      ${vectorTagsHtml}
      ${hasBullets ? `<div class="product-card-body"><div class="product-col"><h4>Key Capabilities</h4>${renderBullets(card.capabilities)}</div><div class="product-col"><h4>Business Outcomes</h4>${renderBullets(card.outcomes)}</div></div>` : ''}
      ${renderAssetRow(card)}
    </article>`;
}

function renderCompactCard(card, typeKey) {
  const meta = TYPE_LABELS[typeKey];
  const filterKey = TYPE_FILTER_KEY[typeKey];
  const { moduleTags, vectorTags } = splitTags(card.tags);
  const tagsHtml = moduleTags.map(t => renderTag(t, typeKey === 'useCases' ? 'gray' : null)).join('');
  const vectorTagsHtml = renderVectorTagRow(vectorTags);
  const summaryText = card.summary || card.description || '';

  return `<div class="card sb-unified-card" id="${escapeHtml(card.id || '')}" data-solution-card data-type="${filterKey}">
      ${renderCardTypeRow(meta)}
      <h3>${escapeHtml(card.title)}</h3>
      ${summaryText ? `<p class="card-summary">${escapeHtml(summaryText)}</p>` : ''}
      ${tagsHtml ? `<div class="card-tags">${tagsHtml}</div>` : ''}
      ${vectorTagsHtml}
      ${card.bullets && card.bullets.length ? `<div class="card-bullets">${renderBullets(card.bullets)}</div>` : ''}
      ${renderAssetRow(card)}
    </div>`;
}

function renderCard(card, typeKey) {
  if (typeKey === 'vectors') return renderProductStyleCard(card, typeKey);
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
  for (const typeKey of ['platform', 'solutions', 'enhancements', 'useCases', 'vectors', 'caseStudies', 'buyers']) {
    const items = content[typeKey] || [];
    for (const card of items) html.push(renderCard(card, typeKey));
  }
  mount.innerHTML = html.join('\n');
}

function init() {
  renderAllCards();
  resolveCardIcons();
  setTimeout(resolveCardIcons, 300);
  document.dispatchEvent(new CustomEvent('solution-cards-rendered'));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
