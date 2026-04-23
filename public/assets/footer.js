// Trendzact Partners — Shared footer

(function () {
  const COLUMNS = [
    {
      heading: 'Selling Tools',
      links: [
        { href: '/discover.html',    label: 'Discover' },
        { href: '/proposal',         label: 'Proposal Builder' },
        { href: '/live-demo.html',   label: 'Demos' },
        { href: '/sales-order.html', label: 'Sales Order' }
      ]
    },
    {
      heading: 'Learn',
      links: [
        { href: '/grc-one.html',          label: 'GRC One' },
        { href: '/video-explainers.html', label: 'Video Explainers' },
        { href: '/gtm-playbook.html',     label: 'GTM Playbook' },
        { href: '/resources.html',        label: 'Resources' }
      ]
    },
    {
      heading: 'Partner Ops',
      links: [
        { href: '/newsletter.html', label: 'Newsletter' },
        { href: '/press.html',      label: 'Press Releases' },
        { href: '/contact.html',    label: 'Contact Us' },
        { href: '#',                label: 'Partner Terms' }
      ]
    }
  ];

  const BRAND_SVG = `
    <svg class="brand-mark" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="2" y="2" width="36" height="36" rx="8" fill="#00827C"/>
      <path d="M11 14h18M20 14v15" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="28" cy="24" r="3" fill="#00A398" stroke="#fff" stroke-width="1.5"/>
    </svg>`;

  function render() {
    const colsHTML = COLUMNS.map(c => `
      <div>
        <h5>${c.heading}</h5>
        ${c.links.map(l => `<a href="${l.href}">${l.label}</a>`).join('\n        ')}
      </div>`).join('\n');

    const year = new Date().getFullYear();

    return `
<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-brand">
      <div class="brand">
        ${BRAND_SVG}
        <div class="brand-text">
          <span class="brand-name">Trendzact</span>
          <span class="brand-sub">Partners</span>
        </div>
      </div>
      <p class="footer-tag">Edge-first governance, risk &amp; security.<br/>Partner-only enablement portal.</p>
    </div>
    <div class="footer-cols">${colsHTML}
    </div>
  </div>
  <div class="footer-base">
    <span>© ${year} Trendzact. Partners Portal. Confidential.</span>
    <span>v1.0 · Firebase Hosting</span>
  </div>
</footer>`;
  }

  function init() {
    const mount = document.getElementById('site-footer');
    if (!mount) return;
    mount.outerHTML = render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
