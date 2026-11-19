/** magazine 版共用的資料整理 */
import { getEntries, getEntry, type CollectionEntry } from 'astro:content';
import { ARTICLE_TYPE_LABEL, readingMinutes } from './content';
import { url } from './urls';

/** 主題配色：封面漸層與分類標籤用 */
export const TOPIC_THEME: Record<string, [string, string]> = {
  cashback: ['#2453d4', '#13246b'],
  'miles-travel': ['#0369a1', '#0b2a45'],
  overseas: ['#0e7c86', '#06363b'],
  'mobile-pay': ['#7c3aed', '#2e1065'],
  'online-shopping': ['#db2777', '#4a0b28'],
  'new-customer': ['#ea580c', '#4a1a04'],
  'no-annual-fee': ['#059669', '#043a2b'],
  'students-young': ['#ca8a04', '#3f2a02'],
  premium: ['#374151', '#0b0f17'],
  basics: ['#4f46e5', '#1e1b4b'],
};
export const topicTheme = (id: string) => TOPIC_THEME[id] ?? ['#2453d4', '#13246b'];

export type PostCardData = {
  href: string;
  title: string;
  summary: string;
  topic: { id: string; name: string };
  label: string;
  date: Date;
  minutes: number;
  cards: CollectionEntry<'cards'>[];
  /** 文章涉及的銀行（篩選用） */
  banks: string[];
};

export async function toPostCard(a: CollectionEntry<'articles'>): Promise<PostCardData> {
  const topic = (await getEntry('topics', a.data.primaryTopic.id))!;
  const allCards = (await getEntries(a.data.cards)).filter(Boolean);
  const cards = allCards.slice(0, 3);
  const banks = [...new Set([...allCards.map((c) => c.data.bank.id), ...a.data.banks.map((b) => b.id)])];
  return {
    href: url.article(a.id),
    title: a.data.title,
    summary: a.data.summary,
    topic: { id: topic.id, name: topic.data.name },
    label: ARTICLE_TYPE_LABEL[a.data.type],
    date: a.data.updatedAt,
    minutes: readingMinutes(a.body),
    cards,
    banks,
  };
}
