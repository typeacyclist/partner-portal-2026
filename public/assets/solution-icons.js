// Trendzact Partners Portal - Solution Builder icon resolver
// Converts gs:// site icon paths into public Firebase Storage download URLs.
// This avoids relying on Firebase Storage SDK initialization for static card icons.

(function () {
  const DEFAULT_BUCKET = 'trendzact-partners-001.firebasestorage.app';

  function isHttpUrl(value) {
    return /^https?:\/\//i.test(value || '');
  }

  function isGsUrl(value) {
    return /^gs:\/\//i.test(value || '');
  }

  function objectPathFromGsUrl(value) {
    const clean = String(value || '').replace(/^gs:\/\//i, '');
    const slashIndex = clean.indexOf('/');
    return slashIndex >= 0 ? clean.slice(slashIndex + 1) : '';
  }

  function toFirebaseDownloadUrl(value) {
    if (!value) return '';
    if (isHttpUrl(value)) return value;

    const bucket = (window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.storageBucket) || DEFAULT_BUCKET;
    const objectPath = isGsUrl(value) ? objectPathFromGsUrl(value) : String(value).replace(/^\/+/, '');

    return 'https://firebasestorage.googleapis.com/v0/b/' + encodeURIComponent(bucket) +
      '/o/' + encodeURIComponent(objectPath) + '?alt=media';
  }

  function resolveSolutionIcons() {
    const images = Array.from(document.querySelectorAll('img[data-card-icon-path]'));
    images.forEach(function (img) {
      const rawPath = img.dataset.cardIconPath;
      if (!rawPath) return;

      const src = toFirebaseDownloadUrl(rawPath);
      if (!src) return;

      img.src = src;
      img.hidden = false;

      const wrapper = img.closest('.card-icon-wrap');
      if (wrapper) wrapper.classList.add('has-image');
    });
  }

  document.addEventListener('solution-cards-rendered', resolveSolutionIcons);
  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(resolveSolutionIcons, 0);
    setTimeout(resolveSolutionIcons, 300);
  });

  window.TrendzactSolutionIcons = {
    resolve: resolveSolutionIcons,
    toFirebaseDownloadUrl: toFirebaseDownloadUrl
  };
})();
