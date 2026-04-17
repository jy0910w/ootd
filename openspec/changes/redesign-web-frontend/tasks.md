## 0. 前置

- [x] 0.1 invoke `frontend-design` skill
- [x] 0.2 確認 `brand_assets/` 無素材（已確認：無）
- [x] 0.3 啟動 `node serve.mjs` 本地伺服器

## 1. 原型設計（index.html）

- [x] 1.1 `/login` 頁面原型：全版圖片背景 + 中央登入卡
- [x] 1.2 `/wardrobe` 頁面原型：Masonry grid + filter bar + hover 操作
- [x] 1.3 `/outfits` 頁面原型：Lookbook 大圖列表
- [x] 1.4 `/recommendations` 頁面原型：AI 推薦卡片
- [x] 1.5 衣物上傳 modal 原型：拖拉上傳 + 多步驟分類
- [x] 1.6 穿搭組合器原型：左側 panel + 右側畫布 + action bar

## 2. 截圖驗證（每頁至少 2 輪）

- [x] 2.1 截圖所有原型頁面（`node screenshot.mjs http://localhost:3000`）
- [x] 2.2 分析截圖，記錄具體差異（px 級別）
- [x] 2.3 修正後重新截圖，確認無明顯問題

## 3. Next.js 移植

- [x] 3.1 安裝 Tailwind CSS v3 與 Lucide React 至 `apps/web`
- [x] 3.2 建立 `tailwind.config.ts` 品牌 token
- [x] 3.3 改寫 `globals.css`（Tailwind directives + 自訂 CSS components）
- [x] 3.4 修正 `postcss.config.js`（CJS 格式，取代 .mjs）
- [x] 3.5 移植 `/login` 頁面（CSS Grid 兩欄、inline style 確保 layout 穩定）
- [x] 3.6 移植 `/wardrobe` 頁面 + 上傳 modal
- [x] 3.7 移植 `/outfits` 頁面
- [x] 3.8 移植 `/outfits/new` 穿搭組合器
- [x] 3.9 移植 `/recommendations` 頁面
- [x] 3.10 重寫 `mvp-nav.tsx`（固定頂部、毛玻璃、active 底線動畫）
- [x] 3.11 建立 `screenshot-auth.mjs`（帶認證截圖工具）

## 4. 品質驗收

- [x] 4.1 Desktop 截圖驗證（1280px）— 5 頁全部通過 Round 1
- [x] 4.2 Mobile RWD 截圖驗證（375px）— 修正 outfits/new 垂直堆疊、recommendations 卡片高度
- [x] 4.3 互動元素 hover / focus-visible / active 狀態（globals.css 已定義）
- [x] 4.4 Empty states（各頁面均有空狀態提示文字）
