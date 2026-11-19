import type { APIRoute } from 'astro';

/**
 * 搜尋與即時瀏覽型 AI 爬蟲一律允許（被 AI 搜尋引用的前提）。
 * 訓練型爬蟲（GPTBot、ClaudeBot、CCBot）屬商業決定：預設允許；要封鎖時把下方註解取消。
 */
export const GET: APIRoute = ({ site }) => {
  if (import.meta.env.DEMO_NOINDEX === '1') {
    return new Response(['# Demo 站：禁止所有爬蟲', 'User-agent: *', 'Disallow: /', ''].join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
  const lines = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /search/',
    'Disallow: /pagefind/',
    '',
    '# 訓練型爬蟲（需要時取消註解以封鎖）',
    '# User-agent: GPTBot',
    '# User-agent: ClaudeBot',
    '# User-agent: CCBot',
    '# Disallow: /',
    '',
    `Sitemap: ${new URL('/sitemap-index.xml', site)}`,
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
