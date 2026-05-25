// Trendzact Partners — Signals Finder
//
// Loads the GRC1 signals catalog (signals-catalog.json), exposes a search
// bar + namespace filter that narrow the result set, and renders one
// matching record at a time with prev/next navigation.
//
// Catalog shape:
//   {
//     generated_at, source, total,
//     namespaces: [{ id, count }, ...],
//     records: [{ id, name, field_name, legacy_id, description, path,
//                 sample_data_type, sample_data, ... }, ...]
//   }

(function () {
  'use strict';

  var CATALOG_URL = '/assets/signals-catalog.json';
  var DEBOUNCE_MS = 120;

  var state = {
    catalog: null,
    query: '',
    namespace: 'all',
    currentIndex: 0
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function highlight(value, query) {
    var str = String(value == null ? '' : value);
    if (!query) return escapeHtml(str);
    var q = query.toLowerCase();
    var lower = str.toLowerCase();
    var out = '';
    var i = 0;
    while (i < str.length) {
      var hit = lower.indexOf(q, i);
      if (hit === -1) {
        out += escapeHtml(str.slice(i));
        break;
      }
      out += escapeHtml(str.slice(i, hit));
      out += '<mark>' + escapeHtml(str.slice(hit, hit + q.length)) + '</mark>';
      i = hit + q.length;
    }
    return out;
  }

  function scoreRecord(rec, q) {
    if (!q) return 1;
    var s = 0;
    var fields = [
      ['id', 100],
      ['legacy_id', 80],
      ['field_name', 70],
      ['name', 60],
      ['path', 40],
      ['description', 20],
      ['sample_data', 10],
      ['sample_data_type', 8]
    ];
    for (var i = 0; i < fields.length; i++) {
      var key = fields[i][0];
      var weight = fields[i][1];
      var v = rec[key];
      if (v == null) continue;
      var lower = String(v).toLowerCase();
      if (lower === q) s += weight * 4;
      else if (lower.indexOf(q) === 0) s += weight * 2;
      else if (lower.indexOf(q) !== -1) s += weight;
    }
    return s;
  }

  function namespaceOf(id) {
    return String(id || '').replace(/-\d+$/, '');
  }

  function filterRecords() {
    var records = state.catalog ? state.catalog.records : [];
    var q = state.query.trim().toLowerCase();
    var ns = state.namespace;
    var scored = [];
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      if (ns !== 'all' && namespaceOf(r.id) !== ns) continue;
      var s = scoreRecord(r, q);
      if (s > 0) scored.push({ rec: r, score: s, idx: i });
    }
    if (q) {
      scored.sort(function (a, b) {
        if (b.score !== a.score) return b.score - a.score;
        return a.idx - b.idx;
      });
    }
    return scored.map(function (x) { return x.rec; });
  }

  function renderNamespaceOptions(catalog) {
    var nsList = catalog && catalog.namespaces ? catalog.namespaces : [];
    var parts = ['<option value="all">All namespaces (' + catalog.total + ')</option>'];
    for (var i = 0; i < nsList.length; i++) {
      var ns = nsList[i];
      parts.push('<option value="' + escapeHtml(ns.id) + '">' + escapeHtml(ns.id) + ' (' + ns.count + ')</option>');
    }
    return parts.join('');
  }

  function renderRecordCard(rec, query) {
    var meta = [];
    if (rec.sample_data_type) meta.push('<span class="signals-tag">' + escapeHtml(rec.sample_data_type) + '</span>');
    if (rec.legacy_id) meta.push('<span class="signals-tag signals-tag-muted">legacy: ' + escapeHtml(rec.legacy_id) + '</span>');
    if (rec.legacy_eval_id) meta.push('<span class="signals-tag signals-tag-muted">eval: ' + escapeHtml(rec.legacy_eval_id) + '</span>');
    if (rec.legacy_rule_id) meta.push('<span class="signals-tag signals-tag-muted">rule: ' + escapeHtml(rec.legacy_rule_id) + '</span>');
    if (rec.rule_bucket) meta.push('<span class="signals-tag signals-tag-muted">bucket: ' + escapeHtml(rec.rule_bucket) + '</span>');

    var detailRows = [];
    var detailFields = [
      ['Description', 'description'],
      ['Path', 'path'],
      ['Sample data type', 'sample_data_type'],
      ['Sample data', 'sample_data'],
      ['Legacy ID', 'legacy_id'],
      ['Legacy eval ID', 'legacy_eval_id'],
      ['Legacy rule ID', 'legacy_rule_id'],
      ['Metric key', 'metric_key'],
      ['Rule bucket', 'rule_bucket'],
      ['Rule types', 'rule_types']
    ];
    for (var i = 0; i < detailFields.length; i++) {
      var label = detailFields[i][0];
      var key = detailFields[i][1];
      var v = rec[key];
      if (v == null || v === '') continue;
      var monoFields = { path: 1, sample_data: 1, field_name: 1, metric_key: 1 };
      var valHtml = monoFields[key]
        ? '<code class="signals-mono">' + highlight(v, query) + '</code>'
        : highlight(v, query);
      detailRows.push(
        '<div class="signals-detail-row">' +
          '<div class="signals-detail-label">' + escapeHtml(label) + '</div>' +
          '<div class="signals-detail-value">' + valHtml + '</div>' +
        '</div>'
      );
    }

    return '' +
      '<article class="signals-record" data-id="' + escapeHtml(rec.id) + '">' +
        '<header class="signals-record-head">' +
          '<div class="signals-record-id">' + highlight(rec.id, query) + '</div>' +
          '<h3 class="signals-record-title">' + highlight(rec.name || rec.field_name || rec.id, query) + '</h3>' +
          '<code class="signals-mono signals-record-field">' + highlight(rec.field_name || '', query) + '</code>' +
          (meta.length ? '<div class="signals-record-meta">' + meta.join('') + '</div>' : '') +
        '</header>' +
        '<div class="signals-record-body">' + detailRows.join('') + '</div>' +
      '</article>';
  }

  function renderResults() {
    var results = filterRecords();
    var q = state.query.trim();
    var total = results.length;

    // Clamp currentIndex to valid range
    if (state.currentIndex < 0) state.currentIndex = 0;
    if (state.currentIndex >= total) state.currentIndex = Math.max(0, total - 1);

    var bodyHtml;
    var navHtml = '';
    if (total === 0) {
      bodyHtml = '<div class="signals-empty">' +
        (q
          ? 'No fields matched <strong>' + escapeHtml(q) + '</strong>' + (state.namespace !== 'all' ? ' in <strong>' + escapeHtml(state.namespace) + '</strong>' : '') + '.'
          : 'No records in this namespace.') +
        '</div>';
    } else {
      var rec = results[state.currentIndex];
      bodyHtml = renderRecordCard(rec, q.toLowerCase());

      var prevDisabled = state.currentIndex <= 0 ? ' disabled' : '';
      var nextDisabled = state.currentIndex >= total - 1 ? ' disabled' : '';
      navHtml = '' +
        '<div class="signals-nav">' +
          '<button type="button" class="signals-nav-btn" id="signals-prev" aria-label="Previous record"' + prevDisabled + '>' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>' +
          '</button>' +
          '<div class="signals-nav-position">' +
            '<span class="signals-nav-current">' + (state.currentIndex + 1) + '</span>' +
            '<span class="signals-nav-sep">/</span>' +
            '<span class="signals-nav-total">' + total + '</span>' +
          '</div>' +
          '<button type="button" class="signals-nav-btn" id="signals-next" aria-label="Next record"' + nextDisabled + '>' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>' +
          '</button>' +
        '</div>';
    }

    var countLabel = total === 1 ? '1 match' : total.toLocaleString() + ' matches';

    return '' +
      '<div class="signals-finder-count">' + countLabel +
        (q ? ' for <strong>' + escapeHtml(q) + '</strong>' : '') +
        (state.namespace !== 'all' ? ' &middot; <strong>' + escapeHtml(state.namespace) + '</strong>' : '') +
      '</div>' +
      '<div class="signals-results">' + bodyHtml + '</div>' +
      navHtml;
  }

  function renderControls(catalog) {
    return '' +
      '<div class="signals-finder-controls">' +
        '<div class="signals-search-wrap">' +
          '<svg class="signals-search-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
          '<input type="search" id="signals-search-input" class="signals-search-input" placeholder="Search by ID, name, field, path, description, or sample data&hellip;" autocomplete="off" spellcheck="false" value="' + escapeHtml(state.query) + '" />' +
          (state.query ? '<button type="button" id="signals-clear" class="signals-clear" aria-label="Clear">×</button>' : '') +
        '</div>' +
        '<label class="signals-namespace-wrap">' +
          '<span class="signals-namespace-label">Namespace</span>' +
          '<select id="signals-namespace-select" class="signals-namespace-select">' + renderNamespaceOptions(catalog) + '</select>' +
        '</label>' +
      '</div>';
  }

  function renderShell() {
    var catalog = state.catalog;
    var mount = document.getElementById('signals-finder-mount');
    if (!mount) return;

    if (!catalog) {
      mount.innerHTML = '<p style="color: var(--med-gray); font-size: 13px;">Loading catalog&hellip;</p>';
      return;
    }

    mount.innerHTML = renderControls(catalog) + renderResults();

    var nsSel = document.getElementById('signals-namespace-select');
    if (nsSel) nsSel.value = state.namespace;

    wireEvents();
  }

  var debounceTimer = null;
  function debouncedRerender() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      debounceTimer = null;
      rerenderResultsOnly();
    }, DEBOUNCE_MS);
  }

  function rerenderResultsOnly() {
    var mount = document.getElementById('signals-finder-mount');
    if (!mount) return;
    var existingCount = mount.querySelector('.signals-finder-count');
    var existingResults = mount.querySelector('.signals-results');
    var existingNav = mount.querySelector('.signals-nav');
    var html = renderResults();
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    var newCount = tmp.querySelector('.signals-finder-count');
    var newResults = tmp.querySelector('.signals-results');
    var newNav = tmp.querySelector('.signals-nav');

    if (existingCount && newCount) existingCount.replaceWith(newCount);
    if (existingResults && newResults) existingResults.replaceWith(newResults);

    if (existingNav && newNav) existingNav.replaceWith(newNav);
    else if (existingNav && !newNav) existingNav.remove();
    else if (!existingNav && newNav) mount.appendChild(newNav);

    var controls = mount.querySelector('.signals-finder-controls');
    if (controls) {
      var clearBtn = controls.querySelector('#signals-clear');
      var wrap = controls.querySelector('.signals-search-wrap');
      if (state.query && !clearBtn && wrap) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'signals-clear';
        btn.className = 'signals-clear';
        btn.setAttribute('aria-label', 'Clear');
        btn.textContent = '×';
        wrap.appendChild(btn);
        btn.addEventListener('click', onClearClick);
      } else if (!state.query && clearBtn) {
        clearBtn.remove();
      }
    }
    wireNavEvents();
  }

  function onSearchInput(e) {
    state.query = e.target.value;
    state.currentIndex = 0;
    debouncedRerender();
  }
  function onNamespaceChange(e) {
    state.namespace = e.target.value;
    state.currentIndex = 0;
    rerenderResultsOnly();
  }
  function onClearClick() {
    state.query = '';
    state.currentIndex = 0;
    var input = document.getElementById('signals-search-input');
    if (input) {
      input.value = '';
      input.focus();
    }
    rerenderResultsOnly();
  }
  function onPrevClick() {
    if (state.currentIndex > 0) {
      state.currentIndex--;
      rerenderResultsOnly();
    }
  }
  function onNextClick() {
    var total = filterRecords().length;
    if (state.currentIndex < total - 1) {
      state.currentIndex++;
      rerenderResultsOnly();
    }
  }
  function onKeyDown(e) {
    var input = document.getElementById('signals-search-input');
    var active = document.activeElement;
    if (active === input) return; // don't hijack arrows while typing
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      onNextClick();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      onPrevClick();
    }
  }

  function wireNavEvents() {
    var prev = document.getElementById('signals-prev');
    var next = document.getElementById('signals-next');
    if (prev) {
      prev.removeEventListener('click', onPrevClick);
      prev.addEventListener('click', onPrevClick);
    }
    if (next) {
      next.removeEventListener('click', onNextClick);
      next.addEventListener('click', onNextClick);
    }
  }

  function wireEvents() {
    var input = document.getElementById('signals-search-input');
    if (input) {
      input.addEventListener('input', onSearchInput);
    }
    var sel = document.getElementById('signals-namespace-select');
    if (sel) {
      sel.addEventListener('change', onNamespaceChange);
    }
    var clearBtn = document.getElementById('signals-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', onClearClick);
    }
    wireNavEvents();

    // Bind keyboard arrows scoped to the finder card so they only fire
    // when the user interacts with it (clicks anywhere inside, hovers,
    // or focuses a nav button).
    var card = document.querySelector('.signals-finder-card');
    if (card) {
      card.removeEventListener('keydown', onKeyDown);
      card.addEventListener('keydown', onKeyDown);
      card.setAttribute('tabindex', '-1');
    }
  }

  function showError(msg) {
    var mount = document.getElementById('signals-finder-mount');
    if (!mount) return;
    mount.innerHTML = '<div class="signals-empty" style="color: #B91C1C;">' + escapeHtml(msg) + '</div>';
  }

  function init() {
    var mount = document.getElementById('signals-finder-mount');
    if (!mount) return;
    fetch(CATALOG_URL, { cache: 'force-cache' })
      .then(function (res) {
        if (!res.ok) throw new Error('Catalog request failed: ' + res.status);
        return res.json();
      })
      .then(function (data) {
        state.catalog = data;
        renderShell();
      })
      .catch(function (err) {
        console.error('[signals-finder] load failed', err);
        showError('Could not load the signals catalog. ' + (err && err.message ? err.message : ''));
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
