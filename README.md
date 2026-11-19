# 愛搭卡 i dot CARD（idotcard）

台灣信用卡資訊網站。純靜態 Astro 7，內容由 Agent 產初稿、人工審稿後發布。

- 架構規劃：https://claude.ai/artifact/L8sFULaNaN5GCprDbWjRL4
- Agent 寫作規範：[AGENTS.md](AGENTS.md)

## 開發

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # 建置 + Pagefind 索引 + SEO 檢查
npm run preview
```

正式建置前設定網域：`SITE_URL=https://你的網域 PRODUCTION=1 npm run build`

## 版型版本

兩個版本共用同一份資料、URL 與 SEO 輸出（canonical、JSON-LD、sitemap 相同），只有版面不同：

| 版本 | 說明 | 指令 | 輸出 |
| --- | --- | --- | --- |
| normal | 簡潔閱讀型：文章雙欄含固定側欄 | `npm run dev` / `npm run build` | `dist/` |
| magazine | 圖片優先的媒體型：品牌色頁首＋主題圖示列、首頁輪播＋人氣排行、列表頁可依銀行與類型篩選、文章寬單欄＋浮動目錄 | `npm run dev:magazine` / `npm run build:magazine` / `npm run preview:magazine`（port 4322） | `dist-magazine/` |

magazine 版的程式在 `src/variants/magazine/`、`src/components/magazine/`、`src/styles/magazine.css`（樣式都限定在 `body.v-mag` 底下）。首頁輪播、編輯推薦與人氣排行的編排在 `src/data/registries/home.json`。

## 目錄

```text
src/
  content.config.ts      所有內容的 Zod schema（不合規就建置失敗）
  data/                  事實資料：cards、banks、merchants、offers、authors、registries
  content/               編輯內容：articles、news、best、compare、glossary、pages
  lib/
    urls.ts              URL 規則（全站唯一定義處）
    seo.ts               JSON-LD 建構函式
    content.ts           資料查詢、反向連結、相關文章、可索引網址總表
  components/            SEO、版型、MDX 元件（CardLink、CardSpec、TermLink）
  layouts/               BaseLayout、ArticleLayout
  pages/                 路由，對應規劃中的 18 類頁面 + sitemap、robots、llms.txt、RSS
scripts/check-site.mjs   建置後 SEO 品質關卡
public/_redirects        301 轉址表
public/_headers          安全與快取標頭
```

## 頁面與 URL

| 頁面 | URL | 來源 |
| --- | --- | --- |
| 信用卡 | `/cards/[id]/` | `src/data/cards/` |
| 銀行 | `/banks/[id]/` | `src/data/banks/` |
| 通路 | `/merchants/[id]/` | `src/data/merchants/` |
| 優惠 | `/offers/[id]/` | `src/data/offers/`（到期自動標示並 noindex） |
| 主題 | `/topics/[id]/`、`/topics/[id]/page/2/` | `src/data/registries/topics.yaml` |
| 標籤 | `/tags/[id]/` | `src/data/registries/tags.yaml`（滿 5 篇且有說明才索引） |
| 文章 | `/articles/[id]/` | `src/content/articles/` |
| 推薦排行 | `/best/[id]/` | `src/content/best/` |
| 比較 | `/compare/[a]-vs-[b]/` | `src/content/compare/` |
| 快訊 | `/news/[id]/` | `src/content/news/` |
| 詞彙 | `/glossary/[id]/` | `src/content/glossary/` |
| 工具 | `/tools/[id]/` | `src/pages/tools/` + `registries/tools.yaml` |
| 作者 | `/authors/[id]/` | `src/data/authors/` |
| 信任頁 | `/about/` 等 6 頁 | `src/content/pages/` |

## 部署

靜態輸出在 `dist/`，可部署到 Cloudflare Pages 等 CDN。建議：

- 每日排程重建一次（優惠到期、時間敏感內容依建置日期判斷）
- 部署後推送 IndexNow（Bing 等）；Google 透過 Search Console 提交 `/sitemap-index.xml`

## 上線前待辦

- [ ] 設定正式網域（`SITE_URL`）
- [ ] 刪除所有 `example-` 範例資料，換成真實卡片與真實作者
- [ ] 撰寫 6 個信任頁內容（`src/content/pages/`）
- [ ] 補預設 OG 圖片
- [ ] 法務確認信用卡廣告自律規範、薦證廣告揭露是否適用
