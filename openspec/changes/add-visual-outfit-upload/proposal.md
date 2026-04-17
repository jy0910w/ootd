# Change: Visual Outfit Upload with AI Item Detection

## Why
目前的穿搭建立流程要求使用者手動新增單品再組合穿搭，操作繁瑣且不直覺。新流程讓使用者直接上傳今天的穿搭照片，由 AI 自動識別其中的單品，使用者只需確認並微調，即可同時建立穿搭和衣櫃單品。同時提供公開的視覺推薦入口，不登入也能試用。

## What Changes
- **新增** `POST /api/v1/outfits/upload`：上傳穿搭圖片 → Cloudinary 存圖 → Gemini 識別單品 → 以 `draft` 狀態暫存 Outfit + WardrobeItems，回傳草稿供前端確認
- **新增** `POST /api/v1/outfits/{id}/confirm`：使用者確認（可編輯）草稿 → Outfit 轉為 `pending`，WardrobeItems 轉為 `active`
- **新增** `POST /api/v1/recommendations/visual`（AllowAnonymous）：上傳圖片 → Gemini 分析風格 → 比對平台穿搭回傳推薦
- **新增** Rate Limiting：保護 Gemini API 呼叫，每 IP 每小時 20 次
- **刪除** `POST /api/v1/outfits`：舊手動組合穿搭端點
- **刪除** `POST /api/v1/items`：舊手動新增單品端點（單品改由穿搭上傳自動建立）
- **修改** 首頁 `/`：改為視覺推薦 Landing Page（3 次免登入試用）
- **修改** `/outfits/new`：改為三步驟穿搭上傳流程（上傳 → 確認 AI 識別 → 完成）
- **修改** `/wardrobe`：移除手動新增單品入口，改為純瀏覽（AI 自動建立單品）

## Impact
- Affected specs: outfits, items, recommendations
- Affected code: OutfitsController, ItemsController, RecommendationsController, GeminiService, InMemoryPlatformStore, Program.cs, apps/web/app/page.tsx, apps/web/app/outfits/new/page.tsx, apps/web/app/wardrobe/page.tsx, apps/web/lib/api.ts
