// Trendzact Partners — Signals Finder
//
// Loads the GRC1 signals catalog (signals-catalog.json), exposes a search
// bar that resolves matches across id, name, field_name, path, description,
// and sample_data, and renders ranked result cards.
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
  var MAX_VISIBLE = 50; // cap initial results; user can refine to narrow
  var DEBOUNCE_MS = 120;

  var state = {
    catalog: null,
    query: '',
    namespace: 'all',
    expandedIds: {}
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

  // Score a record against a query. Higher = better match.
  // Returns 0 if no match at all.
  function scoreRecord(rec, q) {
    if (!q) return 1; // unfiltered list — keep stable order
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

  function renderResultCard(rec, query) {
    var expanded = !!state.expandedIds[rec.id];
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
      '<article class="signals-result' + (expanded ? ' is-expanded' : '') + '" data-id="' + escapeHtml(rec.id) + '">' +
        '<header class="signals-result-head" data-toggle="' + escapeHtml(rec.id) + '">' +
          '<div class="signals-result-id">' + highlight(rec.id, query) + '</div>' +
          '<div class="signals-result-title">' +
            '<h3>' + highlight(rec.name || rec.field_name || rec.id, query) + '</h3>' +
            '<code class="signals-mono signals-result-field">' + highlight(rec.field_name || '', query) + '</code>' +
          '</div>' +
          '<div class="signals-result-meta">' + meta.join('') + '</div>' +
          '<button type="button" class="signals-result-toggle" aria-label="' + (expanded ? 'Collapse' : 'Expand') + '">' + (expanded ? '−' : '+') + '</button>' +
        '</header>' +
        (expanded
          ? '<div class="signals-result-body">' + detailRows.join('') + '</div>'
          : '<p class="signals-result-preview">' + highlight((rec.description || '').slice(0, 180), query) + '</p>') +
      '</article>';
  }

  function renderResults() {
    var results = filterRecords();
    var q = state.query.trim();
    var visible = results.slice(0, MAX_VISIBLE);
    var hidden = results.length - visible.length;

    var resultsHtml;
    if (results.length === 0) {
      resultsHtml = '<div class="signals-empty">' +
        (q
          ? 'No fields matched <strong>' + escapeHtml(q) + '</strong>' + (state.namespace !== 'all' ? ' in <strong>' + escapeHtml(state.namespace) + '</strong>' : '') + '.'
          : 'No records in this namespace.') +
        '</div>';
    } else {
      resultsHtml = visible.map(function (r) { return renderResultCard(r, q.toLowerCase()); }).join('');
      if (hidden > 0) {
        resultsHtml += '<div class="signals-truncated">Showing first ' + MAX_VISIBLE + ' of ' + results.length + ' matches. Refine your search or pick a namespace to narrow.</div>';
      }
    }

    var countLabel = results.length === 1 ? '1 match' : results.length.toLocaleString() + ' matches';

    return '' +
      '<div class="signals-finder-count">' + countLabel +
        (q ? ' for <strong>' + escapeHtml(q) + '</strong>' : '') +
        (state.namespace !== 'all' ? ' &middot; <strong>' + escapeHtml(state.namespace) + '</strong>' : '') +
      '</div>' +
      '<div class="signals-results">' + resultsHtml + '</div>';
  }

  function renderControls(catalog) {
    return '' +
      '<div class="signals-finder-controls">' +
        '<div class="signals-search-wrap">' +
          '<svg class="signals-search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
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
      mount.innerHTML = '<p style="color: var(--med-gray); font-size: 14px; padding: 20px 0;">Loading signals catalog&hellip;</p>';
      return;
    }

    mount.innerHTML = renderControls(catalog) + renderResults();

    // Restore selected option on the namespace dropdown after re-render
    var nsSel = document.getElementById('signals-namespace-select');
    if (nsSel) nsSel.value = state.namespace;

    // Re-focus search input after re-render and put caret at end
    var input = document.getElementById('signals-search-input');
    if (input && document.activeElement !== input && state.query) {
      // Don't steal focus away from other elements on initial render
    }

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
    var existing = mount.querySelector('.signals-finder-count');
    var existingResults = mount.querySelector('.signals-results');
    var html = renderResults();
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    var newCount = tmp.querySelector('.signals-finder-count');
    var newResults = tmp.querySelector('.signals-results');
    if (existing && newCount) existing.replaceWith(newCount);
    if (existingResults && newResults) existingResults.replaceWith(newResults);

    // Manage clear button visibility & wire toggles
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
    wireToggleEvents();
  }

  function onSearchInput(e) {
    state.query = e.target.value;
    debouncedRerender();
  }
  function onNamespaceChange(e) {
    state.namespace = e.target.value;
    rerenderResultsOnly();
  }
  function onClearClick() {
    state.query = '';
    var input = document.getElementById('signals-search-input');
    if (input) {
      input.value = '';
      input.focus();
    }
    rerenderResultsOnly();
  }
  function onResultClick(e) {
    var head = e.target.closest('[data-toggle]');
    if (!head) return;
    var id = head.getAttribute('data-toggle');
    if (!id) return;
    state.expandedIds[id] = !state.expandedIds[id];
    rerenderResultsOnly();
  }

  function wireToggleEvents() {
    var results = document.querySelector('.signals-results');
    if (!results) return;
    results.removeEventListener('click', onResultClick);
    results.addEventListener('click', onResultClick);
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
    wireToggleEvents();
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
