/**
 * JSON-LD 建構函式。每頁輸出一個 @graph，用 @id 串起 Organization、WebSite、WebPage 與頁面主體。
 * 只標記頁面上看得到的內容；不自行加 AggregateRating / Review。
 */
import type { CollectionEntry } from 'astro:content';
import { feeLong, isoDate } from './content';
import { SITE } from './site';
import { absolute, url } from './urls';

type Node = Record<string, unknown>;
export type Crumb = { name: string; href: string };

export const ids = (site: URL) => ({
  org: absolute('/#organization', site),
  website: absolute('/#website', site),
});

export function baseNodes(site: URL): Node[] {
  const id = ids(site);
  return [
    {
      '@type': 'Organization',
      '@id': id.org,
      name: SITE.name,
      alternateName: SITE.alternateName,
      url: absolute('/', site),
      logo: absolute(SITE.logo, site),
      ...(SITE.sameAs.length ? { sameAs: SITE.sameAs } : {}),
    },
    {
      '@type': 'WebSite',
      '@id': id.website,
      name: SITE.name,
      alternateName: SITE.alternateName,
      url: absolute('/', site),
      inLanguage: SITE.locale,
      publisher: { '@id': id.org },
    },
  ];
}

export function webPageNode(
  site: URL,
  opts: {
    path: string;
    title: string;
    description: string;
    type?: string;
    crumbs?: Crumb[];
    datePublished?: Date;
    dateModified?: Date;
    reviewer?: CollectionEntry<'authors'>;
  },
): Node[] {
  const pageUrl = absolute(opts.path, site);
  const nodes: Node[] = [
    {
      '@type': opts.type ?? 'WebPage',
      '@id': `${pageUrl}#webpage`,
      url: pageUrl,
      name: opts.title,
      description: opts.description,
      inLanguage: SITE.locale,
      isPartOf: { '@id': ids(site).website },
      ...(opts.crumbs?.length ? { breadcrumb: { '@id': `${pageUrl}#breadcrumb` } } : {}),
      ...(opts.datePublished ? { datePublished: isoDate(opts.datePublished) } : {}),
      ...(opts.dateModified ? { dateModified: isoDate(opts.dateModified) } : {}),
      ...(opts.reviewer
        ? {
            reviewedBy: { '@id': personId(site, opts.reviewer.id) },
            ...(opts.dateModified ? { lastReviewed: isoDate(opts.dateModified) } : {}),
          }
        : {}),
    },
  ];
  if (opts.crumbs?.length) nodes.push(breadcrumbNode(site, opts.path, opts.crumbs));
  return nodes;
}

export function breadcrumbNode(site: URL, path: string, crumbs: Crumb[]): Node {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${absolute(path, site)}#breadcrumb`,
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: absolute(c.href, site),
    })),
  };
}

export const personId = (site: URL, authorId: string) => `${absolute(url.author(authorId), site)}#person`;

export function personNode(site: URL, a: CollectionEntry<'authors'>): Node {
  return {
    '@type': 'Person',
    '@id': personId(site, a.id),
    name: a.data.name,
    url: absolute(url.author(a.id), site),
    jobTitle: a.data.jobTitle,
    description: a.data.bio,
    ...(a.data.knowsAbout.length ? { knowsAbout: a.data.knowsAbout } : {}),
    ...(a.data.sameAs.length ? { sameAs: a.data.sameAs } : {}),
    worksFor: { '@id': ids(site).org },
  };
}

export function articleNode(
  site: URL,
  opts: {
    path: string;
    type?: 'Article' | 'NewsArticle';
    title: string;
    description: string;
    datePublished: Date;
    dateModified: Date;
    /** 省略時以組織為作者（資料自動產生的頁面，如通路頁、優惠頁） */
    author?: CollectionEntry<'authors'>;
    about?: { name: string; href: string; kind: 'card' | 'bank' }[];
    citations?: string[];
  },
): Node {
  const pageUrl = absolute(opts.path, site);
  return {
    '@type': opts.type ?? 'Article',
    '@id': `${pageUrl}#article`,
    headline: opts.title,
    description: opts.description,
    inLanguage: SITE.locale,
    datePublished: isoDate(opts.datePublished),
    dateModified: isoDate(opts.dateModified),
    author: { '@id': opts.author ? personId(site, opts.author.id) : ids(site).org },
    publisher: { '@id': ids(site).org },
    mainEntityOfPage: { '@id': `${pageUrl}#webpage` },
    ...(opts.about?.length
      ? { about: opts.about.map((x) => ({ '@id': `${absolute(x.href, site)}#${x.kind}` })) }
      : {}),
    ...(opts.citations?.length ? { citation: opts.citations } : {}),
  };
}

export function faqNode(site: URL, path: string, faq: { q: string; a: string }[]): Node | null {
  if (!faq.length) return null;
  return {
    '@type': 'FAQPage',
    '@id': `${absolute(path, site)}#faq`,
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function bankNode(site: URL, b: CollectionEntry<'banks'>): Node {
  return {
    '@type': 'BankOrCreditUnion',
    '@id': `${absolute(url.bank(b.id), site)}#bank`,
    name: b.data.name,
    alternateName: b.data.shortName,
    url: absolute(url.bank(b.id), site),
    sameAs: [b.data.officialUrl],
    description: b.data.description,
  };
}

export function creditCardNode(site: URL, c: CollectionEntry<'cards'>, bank: CollectionEntry<'banks'>): Node {
  return {
    '@type': 'CreditCard',
    '@id': `${absolute(url.card(c.id), site)}#card`,
    name: c.data.name,
    ...(c.data.aliases.length ? { alternateName: c.data.aliases } : {}),
    url: absolute(url.card(c.id), site),
    description: c.data.summary,
    provider: { '@id': `${absolute(url.bank(bank.id), site)}#bank` },
    sameAs: [c.data.officialUrl],
    feesAndCommissionsSpecification: feeLong(c.data),
    brand: c.data.networks.map((n) => n.toUpperCase()),
  };
}

export function itemListNode(site: URL, path: string, items: { name: string; href: string }[], name?: string): Node {
  return {
    '@type': 'ItemList',
    '@id': `${absolute(path, site)}#itemlist`,
    ...(name ? { name } : {}),
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      url: absolute(it.href, site),
    })),
  };
}

export function definedTermNode(site: URL, g: CollectionEntry<'glossary'>): Node {
  return {
    '@type': 'DefinedTerm',
    '@id': `${absolute(url.term(g.id), site)}#term`,
    name: g.data.term,
    description: g.data.definition,
    ...(g.data.aliases.length ? { alternateName: g.data.aliases } : {}),
    url: absolute(url.term(g.id), site),
    inDefinedTermSet: { '@type': 'DefinedTermSet', name: `${SITE.name} 信用卡詞彙表`, url: absolute(url.glossary(), site) },
  };
}

export function webAppNode(site: URL, path: string, name: string, description: string): Node {
  return {
    '@type': 'WebApplication',
    '@id': `${absolute(path, site)}#app`,
    name,
    description,
    url: absolute(path, site),
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
  };
}

export function graph(site: URL, nodes: (Node | null | undefined)[]) {
  return { '@context': 'https://schema.org', '@graph': [...baseNodes(site), ...nodes.filter(Boolean)] };
}
