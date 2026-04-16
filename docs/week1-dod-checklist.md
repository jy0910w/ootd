# Week 1 Definition of Done Checklist

## 1. API (`apps/api`)
- [x] Auth route contracts 已建立：`/auth/register`、`/auth/login`、`/auth/refresh`
- [x] RBAC middleware/policy 已建立，支援 `user|moderator|admin`
- [x] 統一錯誤回應格式已實作（`code/message/details/traceId`）
- [x] Controller skeleton 已建立：`items`、`outfits`、`recommendations`、`feedback`、`admin/moderation`
- [x] Health endpoints 可用：`/health/live`、`/health/ready`

## 2. Database (`PostgreSQL` + EF Core)
- [x] 核心 7 表 entity 已建立（users/items/outfits/outfit_items/recommendation_logs/feedback/moderation_actions）
- [x] UUID PK、FK、時間欄位（`created_at`、`updated_at`）已完成
- [x] 主要索引已建立（`users.email`、FK、`outfits(moderation_status, created_at)`）
- [x] 首支 migration 可 apply/rollback
- [x] seed 草案已建立（至少 admin 帳號與基本 enum/taxonomy）

## 3. Web (`apps/web`)
- [x] App shell + routes 已建立：`/login`、`/wardrobe`、`/outfits/new`、`/recommendations`
- [x] Login/Register UI skeleton 完成
- [x] Wardrobe 頁 skeleton 完成（empty state + upload CTA）
- [x] Recommendation 頁 skeleton 完成（條件輸入 + results placeholder）
- [x] API client wrapper 與共用錯誤處理模式已建立

## 4. Admin (`apps/admin`)
- [x] Admin app shell + protected layout 已建立
- [x] Moderation queue skeleton 完成（pending list + approve/reject action slot）
- [x] User management skeleton 完成（搜尋 + ban/unban action slot）
- [x] Dashboard skeleton 完成（KPI placeholder cards）
- [x] Admin auth guard 與 role check integration point 完成

## 5. Integration
- [x] `packages/types` 已有 MVP 共享 DTO/enum
- [x] Local 開發可同時跑 API + DB
- [x] Web/Admin 至少一頁可成功呼叫 API（mock 或真 API 皆可）
- [ ] README 或開發文件補上本機啟動步驟

## 6. 驗收會議輸出
- [ ] 每個子任務都有 owner
- [ ] 每個 blocker 有處理人與 ETA
- [ ] Week 2 backlog 已凍結
- [ ] Demo 錄影或截圖已留存
