## Context
`apps/web` 為 Next.js 15 App Router 專案，目前無 UI 框架，僅使用手刻 CSS。需引入 Tailwind CSS v4 並重設計所有頁面，同時升級兩個核心使用者流程。

## Goals / Non-Goals
- Goals：統一設計語言、提升視覺品質、改善上傳與組合器 UX
- Non-Goals：不動 `apps/admin`、不改後端 API 合約、不新增頁面路由

## Decisions
- **Tailwind CSS v4**：utility-first，取代手刻 CSS，開發速度快
- **Lucide React**：輕量圖示庫，與 React 生態系整合佳
- **不引入 shadcn/ui**：為保持 bundle 精簡，元件手刻；若後續複雜度增加再評估
- **品牌主色**：沿用 `#2f7a56` forest green，搭配深米白底色與 editorial 排版
- **圖片上傳**：前端直接 `multipart/form-data` POST 至 `/api/v1/upload/image`，取得 URL 後再建立衣物

## Risks / Trade-offs
- 移除手刻 CSS 為 breaking change，需確保所有頁面一次全數遷移，不可半途
- Tailwind v4 設定方式與 v3 不同，需留意 CSS-first config 語法

## Open Questions
- 無
