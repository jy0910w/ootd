# OOTD 平台 MVP 路線圖

## 概覽
- 目標：以 Web 優先方式上線 OOTD MVP，支援上傳、推薦、內容審核流程。
- 技術棧：`.NET API` + `Next.js web` + `Next.js admin` + `PostgreSQL` + 物件儲存。
- Repo 模式：monorepo（`apps/api`、`apps/web`、`apps/admin`、`packages/*`）。

## 範圍
- 納入範圍：Auth、衣櫥單品管理、穿搭貼文、推薦 v1、後台審核、KPI 追蹤。
- 不納入範圍：進階個人化 ML 排序、商城流程、完整社交圖譜功能。

## 架構
- `apps/api`：Auth、RBAC、CRUD APIs、推薦 API、回饋 API、管理後台 API。
- `apps/web`：使用者登入、衣櫥、穿搭上傳、推薦結果與回饋。
- `apps/admin`：審核佇列、審核操作、使用者管理、營運儀表板。
- `packages/types`：共用 request/response 契約與 enum。

## 資料庫規劃
核心資料表：
- `users`
- `items`
- `outfits`
- `outfit_items`
- `recommendation_logs`
- `feedback`
- `moderation_actions`

資料標準：
- 主鍵使用 UUID。
- 所有外鍵建立索引。
- 可變動資料記錄 `created_at` 與 `updated_at`。
- Schema 變更統一透過 EF Core migrations。

## API 規劃（MVP）
- Auth：註冊/登入、token refresh、角色權限授權。
- 使用者領域：item CRUD、outfit CRUD、推薦請求、回饋提交。
- 管理領域：審核佇列、通過/駁回、封禁/解封、審計紀錄。

## 推薦規劃
- v1：依品類/場合/季節做規則過濾 + 排序，並回傳可解釋推薦理由。
- v1.1：加入 embedding 相似度與 feedback 重排。

## 交付時程（8 週）
1. 第 1-2 週：基礎建設
   - schema + migrations、auth + RBAC、圖片上傳流程、web/admin 專案骨架。
2. 第 3-4 週：核心使用者與後台流程
   - item/outfit CRUD、推薦 v1 API、審核佇列。
3. 第 5-6 週：穩定化
   - 測試、可觀測性、效能調校、安全性驗證。
4. 第 7-8 週：上線與迭代
   - 分階段發布、KPI 監控、修 bug、規劃 v1.1。

## 上線檢查清單
- Staging 已驗證 migration 可重放。
- Secrets 僅透過環境變數管理。
- 錯誤追蹤與延遲儀表板已啟用。
- 回滾步驟已文件化並演練。
- 隱私政策與服務條款已發布。

## KPI 目標
- 推薦 CTR >= 20%
- 有幫助回饋比率 >= 35%
- D7 留存 >= 20%
- 推薦 API p95 延遲 < 1.5s
- API 錯誤率 < 1%

## 每週追蹤模板
每個 sprint 可直接沿用：

### Sprint 目標
-

### Planned
- [ ] API
- [ ] Web
- [ ] Admin
- [ ] Database
- [ ] QA/DevOps

### Done
- [ ]

### Blockers
-

### KPI 快照
- CTR:
- 有幫助比率:
- D7 留存:
- API 錯誤率:
- p95 延遲:
