## 1. Backend

- [x] 1.1 Rate Limiter 加入 Program.cs（每 IP 每小時 20 次）
- [x] 1.2 GeminiService 新增 ExtractVisualContextAsync（結構化 JSON）
- [x] 1.3 GeminiService 新增 DetectOutfitItemsAsync（結構化 JSON）
- [x] 1.4 新增 Contracts：OutfitUploadResponse, ConfirmOutfitRequest, VisualRecommendationResponse
- [x] 1.5 InMemoryPlatformStore 新增 draft 流程方法
- [x] 1.6 OutfitsController：刪除舊 POST，新增 POST upload / POST {id}/confirm
- [x] 1.7 ItemsController：刪除 POST /items（手動新增）
- [x] 1.8 RecommendationsController：新增 POST visual（AllowAnonymous）

## 2. Frontend

- [x] 2.1 lib/api.ts 新增 visualRecommend, uploadOutfitForAnalysis, confirmOutfit；刪除舊 createOutfit, createItem
- [x] 2.2 Landing Page（app/page.tsx）：視覺上傳 + 試用計數 + 推薦結果
- [x] 2.3 /outfits/new：三步驟上傳流程（upload → confirm → done）
- [x] 2.4 /wardrobe：移除上傳 modal，改為純瀏覽
- [x] 2.5 /recommendations 更新（ItemIds 欄位移除，改由 AI 帶入）
- [x] 2.6 刪除舊流程殘留程式碼
