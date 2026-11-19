import { getCollection, type CollectionEntry, type CollectionKey } from 'astro:content';
import { PAGE_SIZE, TAG_INDEX_MIN_ARTICLES } from './site';
import { url } from './urls';

// ---------- 日期 ----------

/** YAML 的日期以 UTC 午夜解析，日期型欄位一律用 UTC 取年月日，避免時區位移 */
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);
export const displayDate = (d: Date) => isoDate(d).replaceAll('-', '/');

/** 建置當天（台北時間）。站台每日排程重建，優惠到期與時間敏感內容依此判斷 */
export const BUILD_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Taipei',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());

export const latest = (...dates: (Date | undefined)[]) =>
  new Date(Math.max(...dates.filter((d): d is Date => !!d).map((d) => d.getTime())));

// ---------- 取資料 ----------

type Draftable = { data: { draft?: boolean } };

/** 取得集合內容；`draft: true` 的項目不會出現在正式建置 */
export async function published<C extends CollectionKey>(collection: C): Promise<CollectionEntry<C>[]> {
  const entries = await getCollection(collection);
  return entries.filter((e) => !(e as unknown as Draftable).data.draft);
}

export const byUpdatedDesc = <T extends { data: { updatedAt: Date } }>(a: T, b: T) =>
  b.data.updatedAt.getTime() - a.data.updatedAt.getTime();

export function paginate<T>(items: T[], size = PAGE_SIZE): T[][] {
  if (items.length === 0) return [[]];
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) pages.push(items.slice(i, i + size));
  return pages;
}

// ---------- 優惠 ----------

export const isOfferActive = (offer: CollectionEntry<'offers'>) =>
  isoDate(offer.data.validThrough) >= BUILD_DATE && isoDate(offer.data.validFrom) <= BUILD_DATE;

export const isOfferExpired = (offer: CollectionEntry<'offers'>) => isoDate(offer.data.validThrough) < BUILD_DATE;

/** 回饋項目是否仍在有效期間 */
export const isRewardActive = (r: { validThrough?: Date }) => !r.validThrough || isoDate(r.validThrough) >= BUILD_DATE;

// ---------- 標籤索引規則 ----------

export async function tagArticleCounts() {
  const articles = await published('articles');
  const counts = new Map<string, number>();
  for (const a of articles) for (const t of a.data.tags) counts.set(t.id, (counts.get(t.id) ?? 0) + 1);
  return counts;
}

/** 標籤頁滿 N 篇且有說明才索引，否則 noindex, follow 並排除於 sitemap */
export function isTagIndexable(tag: CollectionEntry<'tags'>, count: number) {
  return count >= TAG_INDEX_MIN_ARTICLES && tag.data.description.trim().length > 0;
}

// ---------- 實體反向連結（「提到它的內容」） ----------

export type Mention = { kind: string; title: string; href: string; updatedAt: Date };

export async function mentionsOf(entity: { collection: 'cards' | 'banks' | 'merchants'; id: string }) {
  const [articles, news, best, compare] = await Promise.all([
    published('articles'),
    published('news'),
    published('best'),
    published('compare'),
  ]);
  const hit = (refs: { id: string }[] | undefined) => !!refs?.some((r) => r.id === entity.id);
  const out: Mention[] = [];
  for (const a of articles) {
    const refs = entity.collection === 'cards' ? a.data.cards : entity.collection === 'banks' ? a.data.banks : a.data.merchants;
    if (hit(refs)) out.push({ kind: '文章', title: a.data.title, href: url.article(a.id), updatedAt: a.data.updatedAt });
  }
  for (const n of news) {
    const refs = entity.collection === 'cards' ? n.data.cards : entity.collection === 'banks' ? n.data.banks : undefined;
    if (hit(refs)) out.push({ kind: '快訊', title: n.data.title, href: url.news(n.id), updatedAt: n.data.updatedAt });
  }
  if (entity.collection === 'cards') {
    for (const b of best)
      if (b.data.picks.some((p) => p.card.id === entity.id))
        out.push({ kind: '排行', title: b.data.title, href: url.best(b.id), updatedAt: b.data.updatedAt });
    for (const c of compare)
      if (hit(c.data.cards)) out.push({ kind: '比較', title: c.data.title, href: url.compare(c.id), updatedAt: c.data.updatedAt });
  }
  return out.sort((x, y) => y.updatedAt.getTime() - x.updatedAt.getTime());
}

// ---------- 相關文章 ----------

/** 同主題 +3、共同卡片 +2、共同標籤 +1；分數相同時新的優先 */
export function relatedArticles(current: CollectionEntry<'articles'>, all: CollectionEntry<'articles'>[], limit = 5) {
  const ids = (refs: { id: string }[]) => new Set(refs.map((r) => r.id));
  const cards = ids(current.data.cards);
  const tags = ids(current.data.tags);
  return all
    .filter((a) => a.id !== current.id)
    .map((a) => {
      let score = a.data.primaryTopic.id === current.data.primaryTopic.id ? 3 : 0;
      score += a.data.cards.filter((c) => cards.has(c.id)).length * 2;
      score += a.data.tags.filter((t) => tags.has(t.id)).length;
      return { a, score };
    })
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score || y.a.data.updatedAt.getTime() - x.a.data.updatedAt.getTime())
    .slice(0, limit)
    .map((x) => x.a);
}

// ---------- 可索引網址總表（sitemap、llms.txt、HTML 網站地圖共用） ----------

export type IndexableUrl = { path: string; title: string; lastmod: Date; group: string };

export async function indexableUrls(): Promise<IndexableUrl[]> {
  const [topics, tags, authors, banks, merchants, cards, offers, tools, articles, news, best, compare, glossary, pages] =
    await Promise.all([
      getCollection('topics'),
      getCollection('tags'),
      getCollection('authors'),
      getCollection('banks'),
      getCollection('merchants'),
      getCollection('cards'),
      getCollection('offers'),
      getCollection('tools'),
      published('articles'),
      published('news'),
      published('best'),
      published('compare'),
      published('glossary'),
      getCollection('pages'),
    ]);
  const counts = await tagArticleCounts();
  const now = new Date(`${BUILD_DATE}T00:00:00Z`);
  const newest = (xs: { data: { updatedAt: Date } }[]) => (xs.length ? latest(...xs.map((x) => x.data.updatedAt)) : now);
  const visible = <T extends { data: { noindex?: boolean } }>(xs: T[]) => xs.filter((x) => !x.data.noindex);

  const out: IndexableUrl[] = [
    { path: url.home(), title: '首頁', lastmod: newest([...articles, ...news, ...cards]), group: 'pages' },
    { path: url.cards(), title: '信用卡總覽', lastmod: newest(cards), group: 'pages' },
    { path: url.banks(), title: '銀行列表', lastmod: newest(banks), group: 'pages' },
    { path: url.merchants(), title: '通路列表', lastmod: newest(merchants), group: 'pages' },
    { path: url.offers(), title: '信用卡優惠總覽', lastmod: newest(offers), group: 'pages' },
    { path: url.topics(), title: '主題列表', lastmod: newest(articles), group: 'pages' },
    { path: url.articles(), title: '全部文章', lastmod: newest(articles), group: 'pages' },
    { path: url.newsIndex(), title: '權益快訊', lastmod: newest(news), group: 'pages' },
    { path: url.bestIndex(), title: '推薦排行', lastmod: newest(best), group: 'pages' },
    { path: url.compareIndex(), title: '信用卡比較', lastmod: newest(compare), group: 'pages' },
    { path: url.tools(), title: '試算工具', lastmod: newest(tools), group: 'pages' },
    { path: url.glossary(), title: '信用卡詞彙表', lastmod: newest(glossary), group: 'pages' },
    { path: url.authors(), title: '作者與審稿團隊', lastmod: now, group: 'pages' },
    { path: url.sitemap(), title: '網站地圖', lastmod: now, group: 'pages' },
    ...pages.map((p) => ({ path: url.page(p.id), title: p.data.title, lastmod: p.data.updatedAt, group: 'pages' })),
    ...authors.map((a) => ({ path: url.author(a.id), title: a.data.name, lastmod: now, group: 'pages' })),
    ...topics.map((t) => ({
      path: url.topic(t.id),
      title: t.data.name,
      lastmod: newest(articles.filter((a) => a.data.primaryTopic.id === t.id)),
      group: 'topics',
    })),
    ...tags
      .filter((t) => isTagIndexable(t, counts.get(t.id) ?? 0))
      .map((t) => ({
        path: url.tag(t.id),
        title: t.data.name,
        lastmod: newest(articles.filter((a) => a.data.tags.some((x) => x.id === t.id))),
        group: 'topics',
      })),
    ...cards.map((c) => ({ path: url.card(c.id), title: c.data.name, lastmod: c.data.updatedAt, group: 'cards' })),
    ...banks.map((b) => ({ path: url.bank(b.id), title: b.data.name, lastmod: b.data.updatedAt, group: 'entities' })),
    ...merchants.map((m) => ({ path: url.merchant(m.id), title: m.data.name, lastmod: m.data.updatedAt, group: 'entities' })),
    ...offers
      .filter((o) => !isOfferExpired(o))
      .map((o) => ({ path: url.offer(o.id), title: o.data.title, lastmod: o.data.updatedAt, group: 'entities' })),
    ...visible(articles).map((a) => ({ path: url.article(a.id), title: a.data.title, lastmod: a.data.updatedAt, group: 'articles' })),
    ...visible(news).map((n) => ({ path: url.news(n.id), title: n.data.title, lastmod: n.data.updatedAt, group: 'articles' })),
    ...visible(best).map((b) => ({ path: url.best(b.id), title: b.data.title, lastmod: b.data.updatedAt, group: 'articles' })),
    ...visible(compare).map((c) => ({ path: url.compare(c.id), title: c.data.title, lastmod: c.data.updatedAt, group: 'articles' })),
    ...tools.map((t) => ({ path: url.tool(t.id), title: t.data.name, lastmod: t.data.updatedAt, group: 'pages' })),
    ...glossary.map((g) => ({ path: url.term(g.id), title: g.data.term, lastmod: g.data.updatedAt, group: 'glossary' })),
  ];
  return out;
}

export const SITEMAP_GROUPS = ['pages', 'topics', 'cards', 'entities', 'articles', 'glossary'] as const;

// ---------- 顯示用小工具 ----------

/** 中文約每分鐘 450 字；去掉 MDX 元件與 Markdown 符號後估算 */
export function readingMinutes(body: string | undefined) {
  if (!body) return 1;
  const text = body.replace(/<[^>]+>/g, '').replace(/[#>*|\-\[\]()`]/g, '').replace(/\s+/g, '');
  return Math.max(1, Math.round(text.length / 450));
}

export const ARTICLE_TYPE_LABEL = { guide: '教學', review: '評測', explainer: '觀念' } as const;

export const initials = (name: string) => [...name.replace(/^範例/, '')][0] ?? name[0];

export const daysUntil = (d: Date) =>
  Math.round((Date.parse(isoDate(d)) - Date.parse(BUILD_DATE)) / 864e5);

// ---------- 卡片顯示 ----------

type CardData = CollectionEntry<'cards'>['data'];

/** 主打回饋：優先用 highlight（合計值），否則取單項最高 */
export function topRate(d: CardData) {
  if (d.highlight) return d.highlight;
  const rate = Math.max(...d.rewards.map((r) => r.ratePercent), ...d.merchantRewards.map((m) => m.ratePercent));
  return { ratePercent: rate, label: '最高回饋' };
}

export const feeShort = (d: CardData) =>
  d.annualFee.amount === undefined ? '依卡別' : d.annualFee.amount === 0 ? '免年費' : `${d.annualFee.amount.toLocaleString('zh-TW')} 元`;

export const feeLong = (d: CardData) =>
  d.annualFee.amount === undefined ? `年費依卡別；${d.annualFee.waiver}` : `年費 ${d.annualFee.amount.toLocaleString('zh-TW')} 元；${d.annualFee.waiver}`;
