import type { APIRoute } from 'astro';
import { indexableUrls, isoDate, latest, SITEMAP_GROUPS } from '@/lib/content';

/** sitemap index：依頁面類型分檔，lastmod 取該組內容最新的 updatedAt（不用建置時間） */
export const GET: APIRoute = async ({ site }) => {
  const all = await indexableUrls();
  const body = SITEMAP_GROUPS.map((g) => {
    const items = all.filter((u) => u.group === g);
    if (!items.length) return '';
    return `<sitemap><loc>${new URL(`/sitemaps/${g}.xml`, site)}</loc><lastmod>${isoDate(latest(...items.map((i) => i.lastmod)))}</lastmod></sitemap>`;
  }).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
