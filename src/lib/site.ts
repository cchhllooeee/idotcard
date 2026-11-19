export const SITE = {
  name: '愛搭卡',
  alternateName: 'i dot CARD',
  /** 迷因由來：i don't care → 少打幾個字 → i dot CARD */
  tagline: '什麼都可以 i don’t care，刷卡回饋一定要ㄎㄟˊ起來',
  /** 首頁 <title> */
  homeTitle: '愛搭卡 i dot CARD｜信用卡回饋比較與搭卡攻略',
  description: '愛搭卡幫你搭出一張主卡、一張補位卡：信用卡回饋比較、通路攻略與用卡知識，每張卡附官方來源與資料核對日期。',
  locale: 'zh-Hant-TW',
  ogLocale: 'zh_TW',
  timeZone: 'Asia/Taipei',
  /** 組織的官方社群帳號，用於 Organization.sameAs */
  sameAs: [] as string[],
  logo: '/favicon.svg',
} as const;

export const NAV = [
  { href: '/cards/', label: '信用卡' },
  { href: '/best/', label: '推薦排行' },
  { href: '/offers/', label: '優惠' },
  { href: '/topics/', label: '主題' },
  { href: '/tools/', label: '工具' },
  { href: '/search/', label: '搜尋' },
] as const;

export const TRUST_LINKS = [
  { href: '/about/', label: '關於我們' },
  { href: '/editorial-policy/', label: '編輯政策' },
  { href: '/methodology/', label: '評選方法' },
  { href: '/disclosure/', label: '合作揭露' },
  { href: '/corrections/', label: '更正紀錄' },
  { href: '/contact/', label: '聯絡我們' },
] as const;

/** 好玩版實驗室（獨立原型，不經 Astro）。GitHub Pages 部署時由 LABS_URL 覆寫成含子路徑的網址 */
export const LABS_URL = import.meta.env.LABS_URL || '/labs/';

/** 列表每頁項目數 */
export const PAGE_SIZE = 24;

/** 標籤頁需達到的文章數才會被索引 */
export const TAG_INDEX_MIN_ARTICLES = 5;
