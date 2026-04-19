// Trendzact Partners Portal — App JS
//
// Header/nav interactivity (mobile drawer toggle, active-link highlighting)
// lives in header.js. This file handles page-specific behavior.

document.addEventListener('DOMContentLoaded', () => {

  // Solution Builder filters (if present)
  const chips = document.querySelectorAll('[data-filter-chip]');
  const searchInput = document.querySelector('[data-solution-search]');
  const cards = document.querySelectorAll('[data-solution-card]');
  let activeType = 'all';
  let activeQuery = '';

  const applyFilters = () => {
    cards.forEach(card => {
      const type = card.dataset.type || '';
      const text = (card.textContent || '').toLowerCase();
      const matchType = activeType === 'all' || type === activeType;
      const matchQuery = !activeQuery || text.includes(activeQuery.toLowerCase());
      card.style.display = (matchType && matchQuery) ? '' : 'none';
    });
  };

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeType = chip.dataset.filterChip;
      applyFilters();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      activeQuery = e.target.value;
      applyFilters();
    });
  }

  // Proposal builder - live pricing preview
  const priceForm = document.getElementById('proposalForm');
  if (priceForm) {
    const update = () => {
      const users = parseInt(document.getElementById('estUsers')?.value || '0', 10) || 0;
      const coreOn = document.getElementById('modCore')?.checked;
      const swaOn = document.getElementById('modSWA')?.checked;
      const siaOn = document.getElementById('modSIA')?.checked;
      const msrOn = document.getElementById('modMSR')?.checked;
      const dlpOn = document.getElementById('modDLP')?.checked;
      const itmOn = document.getElementById('modITM')?.checked;
      const svmOn = document.getElementById('modSVM')?.checked;
      const service = document.querySelector('input[name="service"]:checked')?.value || 'self';

      // Illustrative per-user/month list prices
      const prices = {
        core: 12, swa: 8, sia: 9, msr: 7, dlp: 11, itm: 10, svm: 6
      };
      let perUser = 0;
      if (coreOn) perUser += prices.core;
      if (swaOn)  perUser += prices.swa;
      if (siaOn)  perUser += prices.sia;
      if (msrOn)  perUser += prices.msr;
      if (dlpOn)  perUser += prices.dlp;
      if (itmOn)  perUser += prices.itm;
      if (svmOn)  perUser += prices.svm;

      const serviceAdder = {self: 0, essentials: 4, twentyfour: 8, investigations: 12}[service] || 0;
      perUser += serviceAdder;

      const monthly = perUser * users;
      const annual = monthly * 12;

      const fmt = n => '$' + (n || 0).toLocaleString('en-US');
      const puEl = document.getElementById('pricePerUser');
      const moEl = document.getElementById('priceMonthly');
      const anEl = document.getElementById('priceAnnual');
      if (puEl) puEl.textContent = fmt(perUser) + ' / user / mo';
      if (moEl) moEl.textContent = fmt(monthly);
      if (anEl) anEl.textContent = fmt(annual);
    };
    priceForm.addEventListener('input', update);
    priceForm.addEventListener('change', update);
    update();
  }

});
