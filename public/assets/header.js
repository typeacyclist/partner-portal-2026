// Trendzact Partners — Shared header/nav
//
// Edit this file once; all pages that include <div id="site-header"></div> update.
//
// Responsibilities:
//   - Render the shared utility bar, brand mark, primary navigation, and mobile drawer.
//   - Keep navigation labels aligned to the partner workflow.
//   - Provide accessible active states and mobile-menu behavior.

(function () {
  'use strict';

  const NAV_ITEMS = [
    { href: '/',                    label: 'Home' },
    { href: '/discover.html',       label: 'Discover' },
    // { href: '/live-demo.html',      label: 'Demos' },
    { href: '/gtm-playbook.html',   label: 'Sales Playbook' },
    { href: '/resources.html',      label: 'Resources' },
    { href: '/contact.html',        label: 'Contact' },
    { href: '/proposal',            label: 'Proposal Builder', cta: true }
  ];

  const DRAWER_ITEMS = [
    ...NAV_ITEMS,
    { href: '/grc-one.html',        label: 'GRC One' }
  ];

  const BRAND_SVG = `
    <svg class="brand-mark" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <rect x="2" y="2" width="36" height="36" rx="8" fill="#00827C"/>
      <path d="M11 14h18M20 14v15" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="28" cy="24" r="3" fill="#00A398" stroke="#fff" stroke-width="1.5"/>
    </svg>`;

  function normalizePath(value) {
    try {
      const url = new URL(value, window.location.origin);
      return (url.pathname || '/').replace(/\/+$/, '') || '/';
    } catch (e) {
      return '/';
    }
  }

  function isActiveHref(href) {
    const currentPath = normalizePath(window.location.pathname || '/');
    const hrefPath = normalizePath(href);

    if (hrefPath === '/') return currentPath === '/';
    return currentPath === hrefPath || currentPath.startsWith(hrefPath + '/');
  }

  function renderLink(item, className) {
    const active = isActiveHref(item.href);
    const classes = [className];
    if (active) classes.push('active');
    if (item.cta) classes.push('nav-link-cta');

    return `<a href="${item.href}" class="${classes.join(' ')}"${active ? ' aria-current="page"' : ''}>${item.label}</a>`;
  }

  function render() {
    const navLinks = NAV_ITEMS
      .filter(item => !item.cta)
      .map(item => renderLink(item, 'nav-link'))
      .join('\n      ');

    const drawerLinks = DRAWER_ITEMS
      .map(item => renderLink(item, 'drawer-link'))
      .join('\n    ');

    return `
<!-- Utility bar -->
<div class="util-bar">
  <div class="util-inner">
    <span class="util-tag">PARTNERS ONLY</span>
    <span class="util-text">Internal sales enablement portal — not for customer distribution</span>
    <div class="util-right">
      <span class="util-user">Signed in as <strong>partner@reseller.com</strong></span>
      <a href="#" class="util-link">Sign out</a>
    </div>
  </div>
</div>

<!-- Header / nav -->
<header class="site-header">
  <div class="nav-inner">
    <a href="/" class="brand" aria-label="Trendzact Partners home">
      ${BRAND_SVG}
      <div class="brand-text">
        <span class="brand-name">Trendzact</span>
        <span class="brand-sub">Partners</span>
      </div>
    </a>
    <nav class="primary-nav" aria-label="Primary navigation">
      ${navLinks}
    </nav>
    <div class="nav-cta">
      <a href="/proposal" class="btn btn-primary">New Proposal</a>
      <button class="nav-toggle" type="button" aria-label="Open menu" aria-controls="mobileDrawer" aria-expanded="false" id="navToggle">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
  <nav class="mobile-drawer" id="mobileDrawer" aria-label="Mobile navigation">
    ${drawerLinks}
  </nav>
</header>`;
  }

  function setDrawerState(open) {
    const toggle = document.getElementById('navToggle');
    const drawer = document.getElementById('mobileDrawer');
    if (!toggle || !drawer) return;

    drawer.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  function wireInteractivity() {
    const toggle = document.getElementById('navToggle');
    const drawer = document.getElementById('mobileDrawer');

    if (toggle && drawer) {
      toggle.addEventListener('click', () => {
        setDrawerState(!drawer.classList.contains('open'));
      });

      drawer.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => setDrawerState(false));
      });

      document.addEventListener('keydown', event => {
        if (event.key === 'Escape') setDrawerState(false);
      });
    }
  }

  function init() {
    const mount = document.getElementById('site-header');
    if (!mount) return;

    mount.outerHTML = render();
    wireInteractivity();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
