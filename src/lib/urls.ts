/**
 * URL 規則的唯一定義處。全站一律透過這裡產生網址，不手寫路徑。
 * 規則：英文 slug、全小寫、結尾斜線、最多兩層、不放日期與年份。
 */
export const url = {
  home: () => '/',
  card: (id: string) => `/cards/${id}/`,
  cards: () => '/cards/',
  bank: (id: string) => `/banks/${id}/`,
  banks: () => '/banks/',
  merchant: (id: string) => `/merchants/${id}/`,
  merchants: () => '/merchants/',
  offer: (id: string) => `/offers/${id}/`,
  offers: () => '/offers/',
  topic: (id: string, page = 1) => (page > 1 ? `/topics/${id}/page/${page}/` : `/topics/${id}/`),
  topics: () => '/topics/',
  tag: (id: string, page = 1) => (page > 1 ? `/tags/${id}/page/${page}/` : `/tags/${id}/`),
  tags: () => '/tags/',
  article: (id: string) => `/articles/${id}/`,
  articles: (page = 1) => (page > 1 ? `/articles/page/${page}/` : '/articles/'),
  news: (id: string) => `/news/${id}/`,
  newsIndex: () => '/news/',
  best: (id: string) => `/best/${id}/`,
  bestIndex: () => '/best/',
  compare: (id: string) => `/compare/${id}/`,
  compareIndex: () => '/compare/',
  tool: (id: string) => `/tools/${id}/`,
  tools: () => '/tools/',
  term: (id: string) => `/glossary/${id}/`,
  glossary: () => '/glossary/',
  author: (id: string) => `/authors/${id}/`,
  authors: () => '/authors/',
  page: (id: string) => `/${id}/`,
  search: () => '/search/',
  sitemap: () => '/sitemap/',
};

export function absolute(path: string, site: URL | undefined): string {
  if (!site) throw new Error('astro.config.mjs 缺少 site 設定');
  return new URL(path, site).toString();
}
