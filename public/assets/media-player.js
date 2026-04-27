// Trendzact Partners Portal - reusable media modal
// Supports MP4 video and M4A audio from direct URLs or Firebase Storage object paths.

(function () {
  const MODAL_ID = 'mediaPlayerModal';
  let modal;
  let titleEl;
  let bodyEl;
  let errorEl;
  let openLinkEl;
  let playBtn;
  let pauseBtn;
  let restartBtn;
  let activeMedia;

  function getBucket() {
    return window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.storageBucket;
  }

  function isAbsoluteUrl(value) {
    return /^https?:\/\//i.test(value || '');
  }

  function isGsUrl(value) {
    return /^gs:\/\//i.test(value || '');
  }

  function objectPathFromGsUrl(value) {
    const clean = value.replace(/^gs:\/\//i, '');
    const slashIndex = clean.indexOf('/');
    return slashIndex >= 0 ? clean.slice(slashIndex + 1) : '';
  }

  function toFirebaseDownloadUrl(src) {
    if (!src) return '';
    if (isAbsoluteUrl(src)) return src;

    const bucket = getBucket();
    if (!bucket) return src;

    const objectPath = isGsUrl(src) ? objectPathFromGsUrl(src) : src.replace(/^\/+/, '');
    return 'https://firebasestorage.googleapis.com/v0/b/' + encodeURIComponent(bucket) + '/o/' + encodeURIComponent(objectPath) + '?alt=media';
  }

  function inferType(src, explicitType) {
    const normalizedType = (explicitType || '').toLowerCase();
    if (normalizedType === 'video' || normalizedType === 'audio') return normalizedType;

    const cleanSrc = (src || '').split('?')[0].toLowerCase();
    if (cleanSrc.endsWith('.mp4')) return 'video';
    if (cleanSrc.endsWith('.m4a') || cleanSrc.endsWith('.mp3') || cleanSrc.endsWith('.wav')) return 'audio';
    return 'unknown';
  }

  function setPlayingState(isPlaying) {
    if (!playBtn || !pauseBtn) return;
    playBtn.disabled = isPlaying;
    pauseBtn.disabled = !isPlaying;
  }

  function stopAndReset() {
    if (!activeMedia) return;
    activeMedia.pause();
    activeMedia.currentTime = 0;
    setPlayingState(false);
  }

  function closeModal() {
    stopAndReset();
    activeMedia = null;
    bodyEl.replaceChildren();
    errorEl.classList.remove('open');
    errorEl.textContent = '';
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('media-modal-open');
  }

  function addSource(mediaEl, src, type) {
    const source = document.createElement('source');
    source.src = src;
    source.type = type;
    mediaEl.appendChild(source);
  }

  function showError(message) {
    bodyEl.replaceChildren();
    errorEl.textContent = message;
    errorEl.classList.add('open');
    openLinkEl.style.display = 'none';
    setPlayingState(false);
  }

  function makeButton(label, className, selectorName) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.dataset[selectorName] = 'true';
    button.textContent = label;
    return button;
  }

  function buildModal() {
    const existing = document.getElementById(MODAL_ID);
    if (existing) return;

    modal = document.createElement('div');
    modal.id = MODAL_ID;
    modal.className = 'media-modal-backdrop';
    modal.setAttribute('aria-hidden', 'true');

    const dialog = document.createElement('div');
    dialog.className = 'media-modal';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'mediaPlayerTitle');

    const head = document.createElement('div');
    head.className = 'media-modal-head';

    titleEl = document.createElement('h2');
    titleEl.id = 'mediaPlayerTitle';
    titleEl.className = 'media-modal-title';
    titleEl.textContent = 'Media Preview';

    const closeBtn = makeButton('x', 'media-modal-close', 'mediaClose');
    closeBtn.setAttribute('aria-label', 'Close media player');

    head.append(titleEl, closeBtn);

    bodyEl = document.createElement('div');
    bodyEl.className = 'media-modal-body';

    errorEl = document.createElement('p');
    errorEl.className = 'media-modal-error';

    const foot = document.createElement('div');
    foot.className = 'media-modal-foot';

    const controls = document.createElement('div');
    controls.className = 'media-controls';
    controls.setAttribute('aria-label', 'Media controls');

    playBtn = makeButton('Play', 'btn btn-sm btn-primary', 'mediaPlay');
    pauseBtn = makeButton('Pause', 'btn btn-sm btn-ghost', 'mediaPause');
    pauseBtn.disabled = true;
    restartBtn = makeButton('Restart', 'btn btn-sm btn-secondary', 'mediaRestart');
    controls.append(playBtn, pauseBtn, restartBtn);

    openLinkEl = document.createElement('a');
    openLinkEl.className = 'btn btn-sm btn-ghost';
    openLinkEl.target = '_blank';
    openLinkEl.rel = 'noopener noreferrer';
    openLinkEl.textContent = 'Open in New Tab';

    foot.append(controls, openLinkEl);
    dialog.append(head, bodyEl, errorEl, foot);
    modal.appendChild(dialog);
    document.body.appendChild(modal);

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', function (event) {
      if (event.target === modal) closeModal();
    });

    playBtn.addEventListener('click', function () {
      if (activeMedia) activeMedia.play();
    });

    pauseBtn.addEventListener('click', function () {
      if (activeMedia) activeMedia.pause();
    });

    restartBtn.addEventListener('click', function () {
      if (!activeMedia) return;
      activeMedia.currentTime = 0;
      activeMedia.play();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });
  }

  function openMedia(options) {
    buildModal();

    const src = options.src || '';
    const mediaUrl = toFirebaseDownloadUrl(src);
    const type = inferType(src, options.type);

    titleEl.textContent = options.title || 'Media Preview';
    openLinkEl.href = mediaUrl;
    openLinkEl.style.display = mediaUrl ? '' : 'none';
    errorEl.classList.remove('open');
    errorEl.textContent = '';
    bodyEl.replaceChildren();
    activeMedia = null;

    if (!src) {
      showError('No media source was provided. Add data-media-src to the button or link.');
    } else if (type === 'video') {
      activeMedia = document.createElement('video');
      activeMedia.controls = true;
      activeMedia.playsInline = true;
      activeMedia.preload = 'metadata';
      addSource(activeMedia, mediaUrl, 'video/mp4');
      activeMedia.appendChild(document.createTextNode('Your browser does not support embedded video.'));
      bodyEl.appendChild(activeMedia);
    } else if (type === 'audio') {
      activeMedia = document.createElement('audio');
      activeMedia.controls = true;
      activeMedia.preload = 'metadata';
      addSource(activeMedia, mediaUrl, 'audio/mp4');
      addSource(activeMedia, mediaUrl, 'audio/m4a');
      activeMedia.appendChild(document.createTextNode('Your browser does not support embedded audio.'));
      bodyEl.appendChild(activeMedia);
    } else {
      showError('Unsupported media type. Use .mp4 for video or .m4a for audio, or set data-media-type.');
    }

    if (activeMedia) {
      activeMedia.addEventListener('play', function () { setPlayingState(true); });
      activeMedia.addEventListener('pause', function () { setPlayingState(false); });
      activeMedia.addEventListener('ended', function () { setPlayingState(false); });
      setPlayingState(false);
    }

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('media-modal-open');
  }

  function bindTriggers() {
    document.addEventListener('click', function (event) {
      const trigger = event.target.closest('[data-media-player]');
      if (!trigger) return;

      event.preventDefault();
      openMedia({
        title: trigger.dataset.mediaTitle || trigger.textContent.trim() || 'Media Preview',
        src: trigger.dataset.mediaSrc || trigger.getAttribute('href') || '',
        type: trigger.dataset.mediaType || ''
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    buildModal();
    bindTriggers();
  });

  window.TrendzactMediaPlayer = {
    open: openMedia,
    close: closeModal
  };
})();
