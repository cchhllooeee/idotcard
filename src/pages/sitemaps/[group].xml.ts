import type { APIRoute } from 'astro';
import { indexableUrls, isoDate, SITEMAP_GROUPS } from '@/lib/content';

export function getStaticPaths() {
  return SITEMAP_GROUPS.map((group) => ({ params: { group } }));
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** 只收錄可索引頁（noindex、到期優惠、未達門檻的標籤不收）；Google 會忽略 changefreq / priority，故不輸出 */
export const GET: APIRoute = async ({ params, site }) => {
  const items = (await indexableUrls()).filter((u) => u.group === params.group);
  const body = items.map((u) => `<url><loc>${esc(new URL(u.path, site).toString())}</loc><lastmod>${isoDate(u.lastmod)}</lastmod></url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
