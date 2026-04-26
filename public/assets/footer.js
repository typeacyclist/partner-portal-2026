// Trendzact Partners — Shared footer

(function () {
  const COLUMNS = [
    {
      heading: 'Primary Navigation',
      links: [
        { href: '/discover.html', label: 'Discover' },
        { href: '/live-demo.html', label: 'Demos' },
        { href: '/resources.html', label: 'Resources' },
        { href: '/gtm-playbook.html', label: 'Sales Playbook' },
        { href: '/proposal', label: 'Proposal Builder' },
        { href: '/contact.html', label: 'Contact' }
      ]
    }
  ];

  const BRAND_SVG = `
    <svg class="brand-mark" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="2" y="2" width="36" height="36" rx="8" fill="#00827C"/>
      <path d="M11 14h18M20 14v15" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="28" cy="24" r="3" fill="#00A398" stroke="#fff" stroke-width="1.5"/>
    </svg>`;

  function renderLink(link) {
    return `<a href="${link.href}">${link.label}</a>`;
  }

  function renderColumn(column) {
    const linksHtml = column.links.map(renderLink).join('\n        ');

    return `
      <div>
        <h5>${column.heading}</h5>
        ${linksHtml}
      </div>`;
  }

  function render() {
    const columnsHtml = COLUMNS.map(renderColumn).join('\n');

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
    <div class="footer-cols">${columnsHtml}
    </div>
  </div>
  <div class="footer-base">
    <span>© ${year} Trendzact. Partners Portal. Confidential.</span>
    <span>rev_${Math.floor(Date.now() / 60000)} · v1.0 · Firebase Hosting</span>
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
