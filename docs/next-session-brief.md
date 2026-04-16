# Next Session Brief

## 本次進度摘要
- 日期：
- 完成事項：
  - [ ]
  - [ ]
- 未完成事項：
  - [ ]

## 目前狀態（技術）
- API 狀態：
- DB migration 狀態：
- Web 狀態：
- Admin 狀態：
- 風險/阻塞：

## 下次開始前先讀
- `AGENTS.md`
- `openspec/changes/add-ootd-platform-mvp-roadmap/tasks.md`
- `docs/ootd-platform-mvp-roadmap.md`
- `docs/week1-dod-checklist.md`

## 下次最優先 3 件事
1. 
2. 
3. 

## 驗證步驟（下次接手先跑）
- API build：`dotnet build apps/api/OotdPlatform.Api.csproj`
- DB migration：`dotnet ef database update --project apps/api/OotdPlatform.Api.csproj`
- Web build：`npm run build --prefix apps/web`

## 快速啟動指令
- 啟動 DB：`docker compose up -d db`
- 啟動 API：`dotnet run --project apps/api/OotdPlatform.Api.csproj`
- 啟動 Web：`npm run dev --prefix apps/web`

## 下次可直接貼給 OpenCode 的開場訊息
```txt
請先讀 AGENTS.md、docs/next-session-brief.md、openspec/changes/add-ootd-platform-mvp-roadmap/tasks.md。
先回報目前進度與下一步最優先 3 件事，再開始實作。
```
