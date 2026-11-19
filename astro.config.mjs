// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// 正式網域上線前請設定 SITE_URL；canonical、sitemap、JSON-LD 都依賴它。
const site = process.env.SITE_URL ?? 'https://www.idotcard.com';
// 版型版本：normal（預設）或 magazine。兩版共用資料與 SEO，只有版型不同，輸出到不同資料夾。
const variant = process.env.SITE_VARIANT === 'magazine' ? 'magazine' : 'normal';

export default defineConfig({
  site,
  output: 'static',
  outDir: variant === 'magazine' ? './dist-magazine' : './dist',
  vite: {
    define: {
      'import.meta.env.SITE_VARIANT': JSON.stringify(variant),
      'import.meta.env.DEMO_NOINDEX': JSON.stringify(process.env.DEMO_NOINDEX ?? ''),
    },
  },
  trailingSlash: 'always',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  integrations: [mdx()],
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
});
