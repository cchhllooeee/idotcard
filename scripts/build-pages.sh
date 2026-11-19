#!/usr/bin/env bash
# 建置 GitHub Pages demo：normal 版在 /<repo>/，magazine 版在 /<repo>/magazine/，全站 noindex
# 用法：scripts/build-pages.sh <站台 origin，如 https://帳號.github.io> <子路徑，如 /idotcard/>
set -euo pipefail
ORIGIN="${1:?缺少 origin，例如 https://帳號.github.io}"
BASE="/${2#/}"; BASE="${BASE%/}/"
OUT="${PAGES_OUT:-_site}"

export SITE_URL="$ORIGIN" DEMO_NOINDEX=1
rm -rf "$OUT"

echo "▶ normal 版"
npx astro build
npx pagefind --site dist
node scripts/check-site.mjs
node scripts/rewrite-base.mjs dist "$BASE" "$ORIGIN"

echo "▶ magazine 版"
SITE_VARIANT=magazine npx astro build
npx pagefind --site dist-magazine
SITE_DIST=dist-magazine node scripts/check-site.mjs
node scripts/rewrite-base.mjs dist-magazine "${BASE}magazine/" "$ORIGIN"

mkdir -p "$OUT"
cp -R dist/. "$OUT/"
mkdir -p "$OUT/magazine"
cp -R dist-magazine/. "$OUT/magazine/"
# GitHub Pages 預設會用 Jekyll 處理，底線開頭的 _astro 資料夾會被忽略，必須關掉
touch "$OUT/.nojekyll"
echo "✓ 輸出於 $OUT（normal：${BASE}、magazine：${BASE}magazine/）"
