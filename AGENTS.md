# idotcard Agent 寫作與作業規範

idotcard 是台灣信用卡資訊網站（YMYL：金錢類主題）。Agent 可以寫初稿，但每篇都要經具名審稿者核准才能發布。
完整架構規劃：https://claude.ai/artifact/L8sFULaNaN5GCprDbWjRL4

## 你可以做與不能做的事

| 可以 | 不可以 |
| --- | --- |
| 在 `src/content/{articles,news,best,compare,glossary}/` 新增或更新內容 | 修改 `src/data/` 下的卡片、銀行、通路、優惠事實資料（走資料更新流程，見下方） |
| 從 `src/data/registries/tags.yaml` 挑 2–5 個標籤 | 新增標籤、主題、作者，或改名 |
| 用 `<CardSpec>`、`<CardLink>`、`<TermLink>` 引用資料 | 在內文手打卡片的回饋率、上限、年費等數字 |
| 更新既有頁面的內容與 `updatedAt` | 為了「看起來新」而只改日期 |
| 引用銀行官方頁面作為來源 | 編造數字、來源、使用者評價或作者經歷 |

## 動筆前：先確認要不要開新頁

1. 用 `targetQuery` 在 `src/content/` 搜尋，看是否已有頁面回答同一個搜尋意圖。**有就更新舊頁，不開新頁**（一個查詢只對應一頁）。
2. 選頁面類型：

| 讀者想要 | 頁面類型 | 位置 |
| --- | --- | --- |
| 教學、觀念、怎麼做 | 文章 `type: guide / explainer` | `src/content/articles/` |
| 單張卡值不值得辦 | 文章 `type: review` | `src/content/articles/` |
| 「XX推薦」排行 | 推薦排行 | `src/content/best/` |
| 「A卡 vs B卡」 | 比較（只做有實際搜尋量的組合） | `src/content/compare/` |
| 權益調整、新卡發行 | 快訊 | `src/content/news/` |
| 「XX是什麼」 | 詞彙 | `src/content/glossary/` |

卡片頁、銀行頁、通路頁、優惠頁由 `src/data/` 自動產生，不用寫文章。

3. 在 brief 寫明這篇的**資訊增益**：試算、表格整理、權益變動歷史、實測或原創圖表，至少一項。沒有就不要寫。

## 檔名與 frontmatter

- 檔名 = URL slug：英文、全小寫、連字號，例如 `how-to-choose-cashback-card.mdx`。發布後不改；必須改時在 `public/_redirects` 加 301。
- 欄位定義以 `src/content.config.ts` 為準，不符合就建置失敗。範例：

```yaml
---
title: 現金回饋信用卡怎麼選？4 個步驟算出最適合你的卡   # 8–60 字，可放年份，URL 不放
description: 120 字內的搜尋摘要，寫出這頁能解決什麼問題   # 40–160 字
summary: 40–60 字，直接回答標題問題                      # 頁首「重點摘要」，AI 最常擷取這段
type: guide
primaryTopic: cashback          # 恰好一個，從 registries/topics.yaml 選
tags: [supermarket, annual-fee] # 2–5 個，從 registries/tags.yaml 選
cards: [example-cashback]       # 內文提到的卡全部列出
banks: []
merchants: []
targetQuery: 現金回饋信用卡 怎麼選
author: <作者 id>               # 真實具名的編輯
reviewer: <審稿者 id>
publishedAt: 2026-11-19
updatedAt: 2026-11-19
sources:
  - title: 銀行官方權益頁名稱
    url: https://...
    checkedAt: 2026-11-19
faq:
  - q: 真實搜尋者會問的問題？
    a: 直接回答，一到兩句。
---
```

## 寫作規範（SEO + AIO）

1. **答案先行**：`summary` 直接回答標題；每個 H2 用讀者會問的問題命名，H2 下第一句就是答案。
2. **段落自足**：每段都寫出主詞全名（「範例回饋卡的國內回饋是…」），不寫「這張卡」「它」。AI 會單獨擷取段落。
3. **數字帶條件與日期**：「2026/12/31 前，國內一般消費 1%，每月上限 300 元」，不寫「回饋很優」。
4. **規格用元件**：`<CardSpec id="..." />` 從資料層帶入規格表；提到卡片第一次用 `<CardLink id="..." />`，提到名詞用 `<TermLink id="..." />`。id 不存在會建置失敗。
5. **比較用表格**：Markdown 表格會輸出成 HTML `<table>`，不要把表格做成圖片。
6. **H1 由版型產生**，內文從 `##` 開始；不要在內文再寫 `#`。
7. **FAQ** 寫在 frontmatter `faq`，問題取自真實搜尋查詢（GSC、「其他人也問了」）。
8. **禁用語**：最好、第一、保證、穩賺、必辦、零風險、史上最強。改用可驗證的描述。
9. **合規**：不做投資建議；涉及循環利息、預借現金、分期時，說明成本與風險。

## 資料更新流程（卡片權益變動時）

1. 對照銀行官方公告，修改 `src/data/cards/<id>.yaml`，並更新 `checkedAt`、`updatedAt`，在 `changelog` 加一筆。
2. 有重大變動時另寫一篇 `src/content/news/` 快訊。
3. PR 需附官方公告連結，由人工核准。

## 發布前檢查

```bash
npm run build     # astro build → pagefind → scripts/check-site.mjs
```

`check-site` 會擋下：缺 title/description/canonical、h1 不是 1 個、JSON-LD 壞掉、站內斷鏈、孤兒頁、sitemap 不一致。全部通過、審稿者核准 PR 後才能合併。

## 範例資料

所有 `example-` 開頭的檔案都是虛構範例，上線前刪除。正式建置用 `PRODUCTION=1 npm run build`，仍有範例頁時會失敗。
