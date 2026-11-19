#!/usr/bin/env node
/**
 * 部署到子路徑（例如 GitHub Pages 的 https://帳號.github.io/idotcard/）時使用。
 * 原始碼一律以網站根目錄撰寫連結（正式網域上線時不需要這一步），
 * 建置後再把輸出檔中的根路徑連結加上子路徑前綴。
 *
 * 用法：node scripts/rewrite-base.mjs <輸出資料夾> <子路徑，如 /idotcard/> <站台 origin，如 https://帳號.github.io>
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const [dir, baseArg, origin, rootArg] = process.argv.slice(2);
if (!dir || !baseArg || !origin) {
  console.error('用法：node scripts/rewrite-base.mjs <dist> </base/> <https://origin>');
  process.exit(1);
}
const base = `/${baseArg.replace(/^\/+|\/+$/g, '')}/`;
const originNoSlash = origin.replace(/\/+$/, '');
// 已含站台根子路徑（例如 /idotcard/labs/）的連結不再加前綴
const root = rootArg ? rootArg.replace(/^\/+|\/+$/g, '') + '/' : null;
const escapeRe = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function walk(d) {
  const out = [];
  for (const e of await readdir(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) { if (e.name !== 'pagefind') out.push(...(await walk(p))); }
    else if (/\.(html|xml|txt|webmanifest)$/.test(e.name)) out.push(p);
  }
  return out;
}

let count = 0;
for (const file of await walk(dir)) {
  let s = await readFile(file, 'utf8');
  const before = s;
  // 1. 絕對網址：https://origin/xxx → https://origin/base/xxx（canonical、og:url、JSON-LD、sitemap、RSS、robots、llms.txt）
  s = s.split(`${originNoSlash}/`).join(`${originNoSlash}${base}`).split(`${originNoSlash}${base}${base.slice(1)}`).join(`${originNoSlash}${base}`);
  // 2. HTML 屬性中的根路徑：href="/x"、src="/x"、action="/x"（排除 // 開頭的協定相對網址）
  if (file.endsWith('.html')) {
    const attr = new RegExp(`(\\s(?:href|src|action|poster)=["'])\\/(?!\\/${root ? '|' + escapeRe(root) : ''})`, 'g');
    s = s.replace(attr, `$1${base}`);
  }
  if (s !== before) { await writeFile(file, s); count++; }
}
console.log(`[rewrite-base] ${dir}：${count} 個檔案加上 ${base} 前綴`);
