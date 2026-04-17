# Change: Redesign Web Frontend with Tailwind CSS and Modern Fashion UI

## Why
現有 `apps/web` 使用手刻 CSS，視覺品質低、維護成本高，且缺乏統一設計語言。需重設計為現代 Fashion App 風格，並升級衣物上傳流程與穿搭組合器體驗，以提升使用者留存與轉換率。

## What Changes
- 引入 Tailwind CSS v4 取代手刻 `globals.css`
- 引入 Lucide Icons 圖示系統
- 建立品牌 Design Token（forest green `#2f7a56` 為主色，搭配 editorial 色調）
- 重設計所有頁面：`/login`、`/wardrobe`、`/outfits`、`/outfits/new`、`/recommendations`
- 升級衣物上傳流程：拖拉上傳 + 即時預覽 + 多步驟標籤分類 modal
- 升級穿搭組合器 `/outfits/new`：左側衣物 panel + 右側組合畫布 + AI 填充

## Impact
- Affected specs: `web-ui`
- Affected code: `apps/web/` 所有頁面、`globals.css`、共用元件
- **BREAKING**：移除現有 `globals.css` 手刻樣式類別（`.card`、`.grid`、`.hero` 等），改為 Tailwind utility class
