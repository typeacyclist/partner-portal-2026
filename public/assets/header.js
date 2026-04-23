// Trendzact Partners — Shared header/nav
//
// Edit this file once; all pages that include <div id="site-header"></div> update.
//
// The brand mark SVG, utility bar, primary nav, and mobile drawer all live here.
// Active-link highlighting (based on current URL) and mobile-drawer toggle are
// wired up below.

(function () {
  const NAV_ITEMS = [
    { href: '/discover.html',         label: 'Discover' },
    { href: '/compare.html',          label: 'Compare' },
    { href: '/proposal',              label: 'Proposal Builder' },
    { href: '/live-demo.html',        label: 'Demos' },
    { href: '/gtm-playbook.html',     label: 'GTM Playbook' },
    { href: '/resources.html',        label: 'Resources' }
  ];

  // Mobile drawer shows the full set (including items not in primary nav)
  const DRAWER_ITEMS = [
    { href: '/discover.html',         label: 'Discover' },
    { href: '/compare.html',          label: 'Compare' },
    { href: '/proposal',              label: 'Proposal Builder' },
    { href: '/live-demo.html',        label: 'Demos' },
    { href: '/video-explainers.html', label: 'Video Explainers' },
    { href: '/gtm-playbook.html',     label: 'GTM Playbook' },
    { href: '/sales-order.html',      label: 'Sales Order Procurement' },
    { href: '/newsletter.html',       label: 'Newsletter' },
    { href: '/press.html',            label: 'Press Release' },
    { href: '/contact.html',          label: 'Contact Us' }
  ];

  const BRAND_SVG = `
    <svg class="brand-mark" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="2" y="2" width="36" height="36" rx="8" fill="#00827C"/>
      <path d="M11 14h18M20 14v15" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="28" cy="24" r="3" fill="#00A398" stroke="#fff" stroke-width="1.5"/>
    </svg>`;

  function render() {
    const navLinks = NAV_ITEMS
      .map(i => `<a href="${i.href}" class="nav-link">${i.label}</a>`)
      .join('\n      ');
    const drawerLinks = DRAWER_ITEMS
      .map(i => `<a href="${i.href}">${i.label}</a>`)
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
    <a href="/" class="brand">
      ${BRAND_SVG}
      <div class="brand-text">
        <span class="brand-name">Trendzact</span>
        <span class="brand-sub">Partners</span>
      </div>
    </a>
    <nav class="primary-nav" aria-label="Primary">
      ${navLinks}
    </nav>
    <div class="nav-cta">
      <a href="/proposal" class="btn btn-primary">New Proposal</a>
      <button class="nav-toggle" aria-label="Open menu" id="navToggle">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
  <div class="mobile-drawer" id="mobileDrawer">
    ${drawerLinks}
  </div>
</header>`;
  }

  function wireInteractivity() {
    // Mobile drawer toggle
    const toggle = document.getElementById('navToggle');
    const drawer = document.getElementById('mobileDrawer');
    if (toggle && drawer) {
      toggle.addEventListener('click', () => drawer.classList.toggle('open'));
    }

    // Active-link highlighting — matches on pathname
    const path = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
    document.querySelectorAll('.site-header .nav-link').forEach(a => {
      const href = a.getAttribute('href').replace(/\/+$/, '') || '/';
      if (href === path) a.classList.add('active');
    });
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
