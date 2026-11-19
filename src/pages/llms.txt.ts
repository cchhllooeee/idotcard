import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { published } from '@/lib/content';
import { SITE } from '@/lib/site';
import { url } from '@/lib/urls';

/** llms.txt（選做）：給 AI 工具的 Markdown 網站導覽，建置時自動產生 */
export const GET: APIRoute = async ({ site }) => {
  const abs = (p: string) => new URL(p, site).toString();
  const [topics, best, cards] = await Promise.all([getCollection('topics'), published('best'), getCollection('cards', (c) => c.data.status === 'active')]);
  const md = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.description}`,
    '',
    '資料說明：每張信用卡的回饋、年費與優惠皆附銀行官方來源與「資料核對日期」；權益以銀行公告為準。編輯流程見編輯政策，排行評分方式見評選方法。',
    '',
    '## 主題',
    ...topics.sort((a, b) => a.data.order - b.data.order).map((t) => `- [${t.data.name}](${abs(url.topic(t.id))}): ${t.data.description}`),
    '',
    '## 推薦排行',
    ...best.map((b) => `- [${b.data.title}](${abs(url.best(b.id))}): ${b.data.summary}`),
    '',
    '## 信用卡',
    ...cards.map((c) => `- [${c.data.name}](${abs(url.card(c.id))}): ${c.data.summary}`),
    '',
    '## 網站資訊',
    `- [編輯政策](${abs('/editorial-policy/')})`,
    `- [評選方法](${abs('/methodology/')})`,
    `- [合作揭露](${abs('/disclosure/')})`,
    `- [網站地圖](${abs('/sitemap/')})`,
    '',
  ];
  return new Response(md.join('\n'), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
