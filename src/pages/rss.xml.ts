import type { APIRoute } from 'astro';
import { published } from '@/lib/content';
import { SITE } from '@/lib/site';
import { url } from '@/lib/urls';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const GET: APIRoute = async ({ site }) => {
  const [articles, news] = await Promise.all([published('articles'), published('news')]);
  const items = [
    ...articles.map((a) => ({ title: a.data.title, href: url.article(a.id), description: a.data.summary, date: a.data.publishedAt })),
    ...news.map((n) => ({ title: n.data.title, href: url.news(n.id), description: n.data.summary, date: n.data.publishedAt })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 50);
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(SITE.name)}</title><link>${new URL('/', site)}</link><description>${esc(SITE.description)}</description><language>zh-TW</language>${items
    .map((i) => `<item><title>${esc(i.title)}</title><link>${new URL(i.href, site)}</link><guid>${new URL(i.href, site)}</guid><description>${esc(i.description)}</description><pubDate>${i.date.toUTCString()}</pubDate></item>`)
    .join('')}</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
