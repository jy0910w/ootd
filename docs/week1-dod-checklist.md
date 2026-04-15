# Week 1 Definition of Done Checklist

## 1. API (`apps/api`)
- [ ] Auth route contracts 已建立：`/auth/register`、`/auth/login`、`/auth/refresh`
- [ ] RBAC middleware/policy 已建立，支援 `user|moderator|admin`
- [ ] 統一錯誤回應格式已實作（`code/message/details/traceId`）
- [ ] Controller skeleton 已建立：`items`、`outfits`、`recommendations`、`feedback`、`admin/moderation`
- [ ] Health endpoints 可用：`/health/live`、`/health/ready`

## 2. Database (`PostgreSQL` + EF Core)
- [ ] 核心 7 表 entity 已建立（users/items/outfits/outfit_items/recommendation_logs/feedback/moderation_actions）
- [ ] UUID PK、FK、時間欄位（`created_at`、`updated_at`）已完成
- [ ] 主要索引已建立（`users.email`、FK、`outfits(moderation_status, created_at)`）
- [ ] 首支 migration 可 apply/rollback
- [ ] seed 草案已建立（至少 admin 帳號與基本 enum/taxonomy）

## 3. Web (`apps/web`)
- [ ] App shell + routes 已建立：`/login`、`/wardrobe`、`/outfits/new`、`/recommendations`
- [ ] Login/Register UI skeleton 完成
- [ ] Wardrobe 頁 skeleton 完成（empty state + upload CTA）
- [ ] Recommendation 頁 skeleton 完成（條件輸入 + results placeholder）
- [ ] API client wrapper 與共用錯誤處理模式已建立

## 4. Admin (`apps/admin`)
- [ ] Admin app shell + protected layout 已建立
- [ ] Moderation queue skeleton 完成（pending list + approve/reject action slot）
- [ ] User management skeleton 完成（搜尋 + ban/unban action slot）
- [ ] Dashboard skeleton 完成（KPI placeholder cards）
- [ ] Admin auth guard 與 role check integration point 完成

## 5. Integration
- [ ] `packages/types` 已有 MVP 共享 DTO/enum
- [ ] Local 開發可同時跑 API + DB
- [ ] Web/Admin 至少一頁可成功呼叫 API（mock 或真 API 皆可）
- [ ] README 或開發文件補上本機啟動步驟

## 6. 驗收會議輸出
- [ ] 每個子任務都有 owner
- [ ] 每個 blocker 有處理人與 ETA
- [ ] Week 2 backlog 已凍結
- [ ] Demo 錄影或截圖已留存
