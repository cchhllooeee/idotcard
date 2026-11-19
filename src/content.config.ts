/**
 * 愛搭卡 i dot CARD 內容模型（單一事實來源）
 *
 * - data/：卡片、銀行、通路、優惠、作者、主題與標籤登錄檔 → 事實資料，Agent 不得任意修改
 * - content/：文章、快訊、排行、比較、詞彙、信任頁 → 引用 data/ 的實體 id，不重寫規格
 *
 * frontmatter 不符合 schema 時建置會失敗，這是 Agent 產文的第一道關卡。
 */
import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

// ---------- 共用欄位 ----------

const source = z.object({
  title: z.string().min(2),
  url: z.url(),
  checkedAt: z.coerce.date(),
});

const faqItem = z.object({
  q: z.string().min(4),
  a: z.string().min(10),
});

/** 所有對外發布的編輯內容共用的欄位 */
const editorial = {
  title: z.string().min(8).max(60),
  description: z.string().min(40).max(160),
  /** 40–60 字的重點摘要，放在頁首並直接回答標題問題（AIO 用） */
  summary: z.string().min(20).max(120),
  author: reference('authors'),
  reviewer: reference('authors').optional(),
  publishedAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  sources: z.array(source).default([]),
  faq: z.array(faqItem).default([]),
  draft: z.boolean().default(false),
  noindex: z.boolean().default(false),
};

// ---------- 登錄檔（人工維護） ----------

const topics = defineCollection({
  loader: file('src/data/registries/topics.yaml'),
  schema: z.object({
    name: z.string(),
    description: z.string().min(20),
    /** 主題頁導讀，300–600 字為佳 */
    intro: z.string().default(''),
    order: z.number().int(),
    /** 主題頁「從這裡開始」置頂的文章（建議 3 篇） */
    featured: z.array(reference('articles')).default([]),
    related: z.array(reference('topics')).default([]),
    faq: z.array(faqItem).default([]),
  }),
});

const tags = defineCollection({
  loader: file('src/data/registries/tags.yaml'),
  schema: z.object({
    name: z.string(),
    description: z.string().default(''),
  }),
});

const authors = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/data/authors' }),
  schema: z.object({
    name: z.string(),
    roles: z.array(z.enum(['editor', 'reviewer', 'writer'])).min(1),
    jobTitle: z.string(),
    bio: z.string().min(20),
    credentials: z.array(z.string()).default([]),
    knowsAbout: z.array(z.string()).default([]),
    sameAs: z.array(z.url()).default([]),
    avatar: z.string().optional(),
  }),
});

// ---------- 實體資料 ----------

const banks = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/data/banks' }),
  schema: z.object({
    name: z.string(),
    shortName: z.string(),
    description: z.string().min(20),
    officialUrl: z.url(),
    customerService: z.string().optional(),
    updatedAt: z.coerce.date(),
  }),
});

const merchants = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/data/merchants' }),
  schema: z.object({
    name: z.string(),
    aliases: z.array(z.string()).default([]),
    type: z.enum(['supermarket', 'convenience', 'online', 'dining', 'delivery', 'transport', 'mobile-pay', 'travel', 'other']),
    description: z.string().min(20),
    officialUrl: z.url().optional(),
    updatedAt: z.coerce.date(),
  }),
});

const cards = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/data/cards' }),
  schema: z.object({
    name: z.string(),
    /** 全站統一的別名，AI 實體辨識用 */
    aliases: z.array(z.string()).default([]),
    bank: reference('banks'),
    status: z.enum(['active', 'discontinued']),
    networks: z.array(z.enum(['visa', 'mastercard', 'jcb', 'amex', 'unionpay'])).min(1),
    /** 一句話結論：誰適合這張卡（40–60 字） */
    summary: z.string().min(20).max(120),
    bestFor: z.array(z.string()).min(1),
    notFor: z.array(z.string()).default([]),
    annualFee: z.object({
      /** 官網未明列金額時留空，頁面顯示「依卡別」 */
      amount: z.number().nonnegative().optional(),
      waiver: z.string(),
    }),
    /** 主打回饋（基本＋加碼的合計）。未設定時取單項最高回饋率 */
    highlight: z.object({ ratePercent: z.number().nonnegative(), label: z.string() }).optional(),
    rewards: z
      .array(
        z.object({
          scope: z.string(),
          ratePercent: z.number().nonnegative(),
          capPerMonth: z.number().nonnegative().optional(),
          conditions: z.string().optional(),
          validFrom: z.coerce.date().optional(),
          validThrough: z.coerce.date().optional(),
        }),
      )
      .min(1),
    merchantRewards: z
      .array(
        z.object({
          merchant: reference('merchants'),
          ratePercent: z.number().nonnegative(),
          capPerMonth: z.number().nonnegative().optional(),
          note: z.string().optional(),
          validThrough: z.coerce.date().optional(),
        }),
      )
      .default([]),
    topics: z.array(reference('topics')).default([]),
    similar: z.array(reference('cards')).default([]),
    officialUrl: z.url(),
    /** 有合作導購連結時，連結會加 rel="sponsored" 並顯示揭露 */
    applyUrl: z.url().optional(),
    sponsored: z.boolean().default(false),
    /** 卡面示意圖的漸層色（沒有官方卡面圖時使用） */
    art: z.object({ from: z.string(), to: z.string() }).optional(),
    faq: z.array(faqItem).default([]),
    changelog: z.array(z.object({ date: z.coerce.date(), change: z.string() })).default([]),
    /** 最後一次對照官方資料的日期（≤ 90 天） */
    checkedAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  }),
});

const offers = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/data/offers' }),
  schema: z.object({
    title: z.string().min(8),
    card: reference('cards'),
    type: z.enum(['new-customer', 'limited', 'merchant']),
    summary: z.string().min(20),
    details: z.array(z.string()).min(1),
    registrationRequired: z.boolean().default(false),
    validFrom: z.coerce.date(),
    validThrough: z.coerce.date(),
    officialUrl: z.url(),
    checkedAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  }),
});

const tools = defineCollection({
  loader: file('src/data/registries/tools.yaml'),
  schema: z.object({
    name: z.string(),
    description: z.string().min(20),
    updatedAt: z.coerce.date(),
  }),
});

// ---------- 編輯內容 ----------

const articles = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/articles' }),
  schema: z.object({
    ...editorial,
    type: z.enum(['guide', 'review', 'explainer']),
    primaryTopic: reference('topics'),
    tags: z.array(reference('tags')).max(5).default([]),
    cards: z.array(reference('cards')).default([]),
    banks: z.array(reference('banks')).default([]),
    merchants: z.array(reference('merchants')).default([]),
    /** 這篇要回答的主要搜尋查詢；一個查詢只對應一頁 */
    targetQuery: z.string().min(2),
  }),
});

const news = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/news' }),
  schema: z.object({
    ...editorial,
    cards: z.array(reference('cards')).default([]),
    banks: z.array(reference('banks')).default([]),
    effectiveDate: z.coerce.date().optional(),
  }),
});

const best = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/best' }),
  schema: z.object({
    ...editorial,
    primaryTopic: reference('topics'),
    targetQuery: z.string().min(2),
    criteria: z.array(z.string()).min(1),
    picks: z
      .array(
        z.object({
          card: reference('cards'),
          label: z.string(),
          reason: z.string().min(10),
        }),
      )
      .min(1),
  }),
});

const compare = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/compare' }),
  schema: z.object({
    ...editorial,
    cards: z.tuple([reference('cards'), reference('cards')]),
    targetQuery: z.string().min(2),
    verdict: z.string().min(20),
  }),
});

const glossary = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/glossary' }),
  schema: z.object({
    term: z.string(),
    aliases: z.array(z.string()).default([]),
    /** 一句話定義，AI 擷取最常用的段落 */
    definition: z.string().min(10).max(120),
    related: z.array(reference('glossary')).default([]),
    updatedAt: z.coerce.date(),
    sources: z.array(source).default([]),
    draft: z.boolean().default(false),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().min(20),
    pageType: z.enum(['AboutPage', 'ContactPage', 'WebPage']).default('WebPage'),
    updatedAt: z.coerce.date(),
  }),
});

export const collections = {
  topics,
  tags,
  authors,
  banks,
  merchants,
  cards,
  offers,
  tools,
  articles,
  news,
  best,
  compare,
  glossary,
  pages,
};
