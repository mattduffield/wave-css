#!/usr/bin/env node
/**
 * vendor-assets.mjs — download the pinned third-party libs Wave lazy-loads into a local
 * mirror laid out exactly as `window.WaveAssetBase` expects:
 *
 *     <outDir>/<lib>-<version>/<path-after-cdn-version>
 *
 * so a host can self-host them (see the "Self-hosting third-party assets" docs). Point a
 * `<script>window.WaveAssetBase='/static/js'</script>` at the copied folder and every asset
 * loads locally, with automatic CDN fallback if any file is missing.
 *
 * On-demand libraries (CodeMirror modes/themes/addons, Prism components/themes) are loaded
 * at runtime by name, so we download the WHOLE minified tree (via the cdnjs file-list API) —
 * cherry-picking only the files with literal URLs in the source leaves gaps (e.g. a table
 * editor needs mode/sql, a JS editor needs mode/javascript, and any theme can be selected).
 *
 * Usage:
 *   node scripts/vendor-assets.mjs [outDir] [--only=codemirror,prism,files] [--force] [--concurrency=12]
 *   npm run vendor-assets -- /path/to/static/js
 *
 * Default outDir: ./vendor  (copy its contents into your static/js/).
 */

import { mkdir, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const args = process.argv.slice(2);
const outDir = args.find(a => !a.startsWith('--')) || 'vendor';
const only = (args.find(a => a.startsWith('--only=')) || '').slice('--only='.length).split(',').filter(Boolean);
const force = args.includes('--force');
const concurrency = parseInt((args.find(a => a.startsWith('--concurrency=')) || '').slice('--concurrency='.length)) || 12;

const want = (group) => only.length === 0 || only.includes(group);

// cdnjs libraries loaded ON DEMAND — download every minified file in the tree.
const CDNJS_TREES = [
  { group: 'codemirror', name: 'codemirror', version: '5.65.13' },
  { group: 'prism',      name: 'prism',      version: '1.29.0'  },
];

// Fixed-URL libs (a known small set of files). One entry per exact CDN URL that Wave loads.
const FILES = [
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js',
  'https://cdn.jsdelivr.net/npm/cm-show-invisibles@3.1.0/lib/show-invisibles.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.9/purify.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://unpkg.com/jspdf-autotable@3.8.4/dist/jspdf.plugin.autotable.js',
  'https://cdn.jsdelivr.net/npm/luxon@2.3.1/build/global/luxon.min.js',
  'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js',
  'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css',
  'https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.2/marked.min.js',
  'https://cdn.jsdelivr.net/npm/marked@4/lib/marked.esm.js',
  'https://cdnjs.cloudflare.com/ajax/libs/imask/7.6.1/imask.min.js',
  'https://unpkg.com/sweetalert2@11.15.10/dist/sweetalert2.all.js',
  'https://unpkg.com/tabulator-tables@6.3.0/dist/js/tabulator.min.js',
  'https://unpkg.com/tabulator-tables@6.3.0/dist/css/tabulator.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/turndown/7.1.3/turndown.min.js',
  'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js',
];

// Map a CDN URL to its <lib>-<version>/<rest> local sub-path — same rules as waveLocalAssetUrl.
function localSubPath(cdnUrl) {
  const u = new URL(cdnUrl);
  const host = u.hostname;
  const path = u.pathname;
  if (host.includes('cdnjs.cloudflare.com')) {
    const m = path.replace(/^\/ajax\/libs\//, '').match(/^([^/]+)\/([^/]+)\/(.*)$/);
    if (!m) return null;
    return `${m[1]}-${m[2]}/${m[3]}`;
  }
  if (host.includes('cdn.sheetjs.com')) return path.replace(/^\//, ''); // already /xlsx-<ver>/...
  if (host.includes('jsdelivr.net') || host.includes('unpkg.com')) {
    let s = path.replace(/^\/npm\//, '').replace(/^\//, '');
    let scope = '';
    if (s.startsWith('@')) { const i = s.indexOf('/'); scope = s.slice(0, i + 1); s = s.slice(i + 1); }
    const at = s.indexOf('@'); if (at === -1) return null;
    const name = s.slice(0, at);
    const afterAt = s.slice(at + 1);
    const slash = afterAt.indexOf('/');
    const ver = slash === -1 ? afterAt : afterAt.slice(0, slash);
    const rest = slash === -1 ? '' : afterAt.slice(slash + 1);
    return `${scope}${name}-${ver}${rest ? '/' + rest : ''}`;
  }
  return null;
}

async function exists(p) { try { await access(p); return true; } catch { return false; } }

async function download(url, dest) {
  if (!force && await exists(dest)) return 'skip';
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  const buf = Buffer.from(await r.arrayBuffer());
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, buf);
  return 'ok';
}

// Simple concurrency-limited runner over a list of {url, dest} jobs.
async function runPool(jobs) {
  let ok = 0, skip = 0, fail = 0;
  let i = 0;
  const workers = Array.from({ length: Math.min(concurrency, jobs.length) }, async () => {
    while (i < jobs.length) {
      const job = jobs[i++];
      try {
        const res = await download(job.url, job.dest);
        if (res === 'ok') { ok++; if (ok % 25 === 0) process.stdout.write(`  …${ok} downloaded\n`); }
        else skip++;
      } catch (e) {
        fail++;
        console.warn(`  ✗ ${job.url} — ${e.message}`);
      }
    }
  });
  await Promise.all(workers);
  return { ok, skip, fail };
}

async function main() {
  const jobs = [];

  // Fixed-URL files
  if (want('files')) {
    for (const url of FILES) {
      const sub = localSubPath(url);
      if (!sub) { console.warn(`  ! could not map ${url}`); continue; }
      jobs.push({ url, dest: join(outDir, sub) });
    }
  }

  // cdnjs on-demand trees (every .min.js / .min.css)
  for (const tree of CDNJS_TREES) {
    if (!want(tree.group)) continue;
    const api = `https://api.cdnjs.com/libraries/${tree.name}/${tree.version}?fields=files`;
    const r = await fetch(api);
    if (!r.ok) { console.warn(`  ✗ file list ${api} — ${r.status}`); continue; }
    const { files = [] } = await r.json();
    const min = files.filter(f => f.endsWith('.min.js') || f.endsWith('.min.css'));
    console.log(`  ${tree.name}@${tree.version}: ${min.length} minified files`);
    for (const f of min) {
      jobs.push({
        url: `https://cdnjs.cloudflare.com/ajax/libs/${tree.name}/${tree.version}/${f}`,
        dest: join(outDir, `${tree.name}-${tree.version}`, f),
      });
    }
  }

  console.log(`\nVendoring ${jobs.length} files into "${outDir}" (concurrency ${concurrency}${force ? ', force' : ''})…\n`);
  const { ok, skip, fail } = await runPool(jobs);
  console.log(`\nDone: ${ok} downloaded, ${skip} already present, ${fail} failed.`);
  if (fail) process.exitCode = 1;
}

main().catch(e => { console.error(e); process.exit(1); });
