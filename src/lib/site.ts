export const SITE = {
  name: 'idotcard',
  alternateName: 'idotcard 信用卡資訊',
  description: '台灣信用卡權益、回饋比較與用卡知識，每張卡附官方來源與資料核對日期。',
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

/** 列表每頁項目數 */
export const PAGE_SIZE = 24;

/** 標籤頁需達到的文章數才會被索引 */
export const TAG_INDEX_MIN_ARTICLES = 5;
