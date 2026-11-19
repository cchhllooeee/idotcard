#!/usr/bin/env node
/**
 * 建置後的 SEO 品質關卡（npm run build 最後一步，CI 必跑）
 *
 * 錯誤（exit 1）：
 *  - 可索引頁缺 title / description / canonical / h1，或有多個 h1
 *  - canonical 與實際網址不符
 *  - JSON-LD 無法解析
 *  - 站內連結指向不存在的頁面（斷鏈）
 *  - 可索引頁沒有任何站內入鏈（孤兒頁，只計 <main> 內的連結）
 *  - sitemap 收錄了不存在或 noindex 的網址；可索引頁未被 sitemap 收錄
 *  - 正式建置（PRODUCTION=1）仍有 example- 範例資料
 * 警告：
 *  - 入鏈少於 3 條、title 或 description 重複、title 過長
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const DIST = new URL(`../${process.env.SITE_DIST ?? 'dist'}/`, import.meta.url).pathname;
const MIN_INBOUND_WARN = 3;
const UTILITY = new Set(['/', '/404/', '/search/', '/sitemap/']);
const PRODUCTION = process.env.PRODUCTION === '1';

const errors = [];
const warnings = [];

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'pagefind' || e.name === '_astro') continue;
      out.push(...(await walk(p)));
    } else out.push(p);
  }
  return out;
}

const toRoute = (file) => {
  const rel = '/' + relative(DIST, file).split(sep).join('/');
  return rel.endsWith('/index.html') ? rel.slice(0, -'index.html'.length) : rel === '/404.html' ? '/404/' : rel;
};
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');

const files = await walk(DIST);
const routes = new Set(files.map(toRoute));
const pages = new Map();

for (const file of files.filter((f) => f.endsWith('.html'))) {
  const route = toRoute(file);
  const html = await readFile(file, 'utf8');
  // Demo 站全站 noindex 時，以 data-original 記錄的原始設定檢查
  const robotsTag = html.match(/<meta name="robots"[^>]*>/)?.[0] ?? '';
  const robots = robotsTag.match(/data-original="([^"]*)"/)?.[1] ?? robotsTag.match(/content="([^"]*)"/)?.[1] ?? '';
  const main = html.match(/<main[\s\S]*?<\/main>/)?.[0] ?? '';
  const links = [...main.matchAll(/<a\s[^>]*href="([^"]+)"/g)].map((m) => decode(m[1]));
  const allLinks = [...html.matchAll(/<a\s[^>]*href="([^"]+)"/g)].map((m) => decode(m[1]));
  pages.set(route, {
    route,
    noindex: robots.includes('noindex'),
    title: decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? ''),
    description: decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? ''),
    canonical: html.match(/<link rel="canonical" href="([^"]*)"/)?.[1],
    h1: (main.match(/<h1[\s>]/g) ?? []).length,
    jsonLd: [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]),
    links,
    allLinks,
  });
}

if (!pages.has('/')) { console.error('[check-site] dist 缺少首頁，請先完整執行 astro build'); process.exit(1); }
// 站台網址：取首頁 canonical
const siteOrigin = new URL(pages.get('/')?.canonical ?? 'https://example.com/').origin;
const internalPath = (href) => {
  if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return null;
  const u = new URL(href, siteOrigin + '/');
  if (u.origin !== siteOrigin) return null;
  return u.pathname;
};

// ---- 每頁基本檢查與斷鏈 ----
const inbound = new Map();
for (const p of pages.values()) {
  if (p.route === '/404/') continue;
  for (const raw of p.jsonLd) {
    try { JSON.parse(raw); } catch { errors.push(`${p.route} JSON-LD 無法解析`); }
  }
  if (!p.noindex) {
    if (!p.title) errors.push(`${p.route} 缺少 <title>`);
    if (!p.description) errors.push(`${p.route} 缺少 meta description`);
    if (p.h1 !== 1) errors.push(`${p.route} <h1> 數量為 ${p.h1}，應為 1`);
    if (!p.canonical) errors.push(`${p.route} 缺少 canonical`);
    else if (new URL(p.canonical).pathname !== p.route) errors.push(`${p.route} canonical 指向 ${p.canonical}`);
    if ([...p.title].length > 45) warnings.push(`${p.route} title ${[...p.title].length} 字，搜尋結果可能被截斷`);
  }
  for (const href of p.allLinks) {
    const path = internalPath(href);
    if (!path || path.startsWith('/pagefind/')) continue;
    if (!routes.has(path)) errors.push(`${p.route} 斷鏈 → ${href}`);
  }
  for (const href of new Set(p.links)) {
    const path = internalPath(href);
    if (!path || path === p.route) continue;
    inbound.set(path, (inbound.get(path) ?? 0) + 1);
  }
}

// ---- 孤兒頁 ----
for (const p of pages.values()) {
  if (p.noindex || UTILITY.has(p.route)) continue;
  const n = inbound.get(p.route) ?? 0;
  if (n === 0) errors.push(`${p.route} 是孤兒頁（<main> 內沒有任何站內入鏈）`);
  else if (n < MIN_INBOUND_WARN) warnings.push(`${p.route} 只有 ${n} 條站內入鏈`);
}

// ---- 重複 title / description ----
for (const key of ['title', 'description']) {
  const seen = new Map();
  for (const p of pages.values()) {
    if (p.noindex || !p[key]) continue;
    seen.set(p[key], [...(seen.get(p[key]) ?? []), p.route]);
  }
  for (const [v, rs] of seen) if (rs.length > 1) warnings.push(`${key} 重複（${rs.join('、')}）：${v.slice(0, 40)}`);
}

// ---- sitemap 一致性 ----
const sitemapUrls = new Set();
for (const f of files.filter((f) => f.includes(`${sep}sitemaps${sep}`) && f.endsWith('.xml'))) {
  const xml = await readFile(f, 'utf8');
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) sitemapUrls.add(new URL(decode(m[1])).pathname);
}
for (const path of sitemapUrls) {
  const p = pages.get(path);
  if (!p) errors.push(`sitemap 收錄了不存在的網址 ${path}`);
  else if (p.noindex) errors.push(`sitemap 收錄了 noindex 頁 ${path}`);
}
for (const p of pages.values()) {
  if (p.noindex || p.route === '/404/' || /\/page\/\d+\/$/.test(p.route)) continue;
  if (!sitemapUrls.has(p.route)) errors.push(`可索引頁未被 sitemap 收錄：${p.route}`);
}

// ---- 範例資料 ----
const samples = [...pages.keys()].filter((r) => r.includes('/example-'));
if (samples.length) (PRODUCTION ? errors : warnings).push(`仍有 ${samples.length} 個範例頁（example-*），上線前請刪除範例資料`);

// ---- 輸出 ----
const indexable = [...pages.values()].filter((p) => !p.noindex).length;
console.log(`\n[check-site] ${pages.size} 個 HTML 頁、${indexable} 個可索引、sitemap ${sitemapUrls.size} 個網址`);
for (const w of warnings) console.log(`  ⚠ ${w}`);
for (const e of errors) console.log(`  ✗ ${e}`);
if (errors.length) {
  console.log(`\n[check-site] ${errors.length} 個錯誤，建置不通過\n`);
  process.exit(1);
}
console.log(`[check-site] 通過（${warnings.length} 個警告）\n`);
