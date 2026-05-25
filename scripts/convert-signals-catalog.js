#!/usr/bin/env node
// Convert the GRC1 signals YAML to JSON for client-side use.
//
// Usage:
//   node scripts/convert-signals-catalog.js \
//     "<path-to>/GRC1_signals_calc_metrics_enrichment_detection_dictionary_deduped_vFINAL_2026-02-28.yml" \
//     public/assets/signals-catalog.json
//
// The source YAML uses `-id:` (no space) instead of standard `- id:`.
// We parse it line-by-line: a new record starts at any line that begins
// with `-id:`, and subsequent indented `key: value` lines belong to it.

const fs = require('fs');
const path = require('path');

const src = process.argv[2];
const dst = process.argv[3];
if (!src || !dst) {
  console.error('Usage: convert-signals-catalog.js <input.yml> <output.json>');
  process.exit(1);
}

const text = fs.readFileSync(src, 'utf8');
const lines = text.split(/\r?\n/);

function stripQuotes(v) {
  if (v == null) return v;
  v = v.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  return v;
}

const records = [];
let current = null;

for (let i = 0; i < lines.length; i++) {
  const raw = lines[i];
  if (!raw) continue;
  const trimmedLeft = raw.replace(/^\s+/, '');
  if (trimmedLeft.startsWith('#')) continue;

  // New record: a line that starts (no leading whitespace) with `-id:`.
  if (/^-id\s*:/.test(raw)) {
    if (current) records.push(current);
    const value = raw.replace(/^-id\s*:\s*/, '');
    current = { id: stripQuotes(value) };
    continue;
  }

  if (!current) continue;

  // Indented key: value line on the current record.
  const m = raw.match(/^\s+([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/);
  if (m) {
    const key = m[1];
    const value = stripQuotes(m[2]);
    current[key] = value;
  }
}
if (current) records.push(current);

// Build namespace counts so the UI can show counts in filters.
const namespaces = {};
for (const r of records) {
  const id = r.id || '';
  // Namespace = everything before the trailing -NNN
  const ns = id.replace(/-\d+$/, '');
  if (!ns) continue;
  namespaces[ns] = (namespaces[ns] || 0) + 1;
}
const namespaceList = Object.keys(namespaces).sort().map(function (ns) {
  return { id: ns, count: namespaces[ns] };
});

const output = {
  generated_at: new Date().toISOString(),
  source: path.basename(src),
  total: records.length,
  namespaces: namespaceList,
  records: records
};

fs.writeFileSync(dst, JSON.stringify(output, null, 2) + '\n', 'utf8');
console.log('Wrote ' + records.length + ' records across ' + namespaceList.length + ' namespaces to ' + dst);
