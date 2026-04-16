# OOTD Platform — 本機開發指南

## 專案結構

```
ootd-backend/
├── apps/
│   ├── api/          # ASP.NET Core 10 後端 API
│   ├── web/          # Next.js 15 使用者前端（port 3000）
│   └── admin/        # Next.js 15 管理後台（port 3001）
├── packages/
│   └── types/        # 共用 TypeScript DTO/enum
├── docs/             # 設計文件、API 契約
├── scripts/          # 工具腳本
└── docker-compose.yml
```

## 前置需求

| 工具 | 版本 |
|------|------|
| .NET SDK | 10.0+ |
| Node.js | 20+ |
| PostgreSQL | 15+ |
| npm | 10+ |

## 啟動步驟

### 1. 啟動 PostgreSQL

**本機 PostgreSQL（推薦開發用）：**

確認 PostgreSQL 在 `localhost:5432` 執行，並建立資料庫與使用者：

```sql
CREATE USER admin WITH PASSWORD 'your_secure_password';
CREATE DATABASE ootd_platform OWNER admin;
```

**或使用 Docker Compose：**

```bash
docker compose up -d postgres
```

### 2. 啟動後端 API

```bash
ASPNETCORE_ENVIRONMENT=Development dotnet run --project apps/api --no-launch-profile -- --urls "http://localhost:5282"
```

首次啟動時會自動執行 EF Core migration 並建立 schema。

**驗證：**
```bash
curl http://localhost:5282/api/v1/health/ready
# 預期：{"status":"ok","db":"ready"}
```

**初始 Admin 帳號：**

若 `users` 表為空，系統會自動 seed：
- Email: `admin@example.com`
- Password: `Admin123!`

> 注意：若 DB 已有使用者，seed 不會執行。需手動建立 admin 帳號。

### 3. 安裝前端相依

```bash
npm install --prefix apps/web
npm install --prefix apps/admin
```

### 4. 設定前端環境變數

```bash
cp apps/web/.env.local.example apps/web/.env.local
cp apps/admin/.env.local.example apps/admin/.env.local
```

預設值（`.env.local`）：

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5282/api/v1
```

### 5. 啟動前端

**使用者端（port 3000）：**
```bash
npm run dev --prefix apps/web
```

**管理後台（port 3001）：**
```bash
npm run dev --prefix apps/admin
```

## E2E API 驗收測試

確認 API 正常啟動後，執行主流程驗收腳本：

```bash
chmod +x scripts/e2e-api-test.sh
./scripts/e2e-api-test.sh
```

腳本會依序測試：Health → 註冊/登入 → Items CRUD → Outfits CRUD → Recommendations → Feedback → Admin 審核

## 常見問題

### API 啟動失敗（DB 無法連線）

確認是否設定 `ASPNETCORE_ENVIRONMENT=Development`。Production 模式不含 DB 連線設定。

### Admin 登入失敗

若 `users` 表不為空但沒有 admin 帳號，需手動執行：

```sql
-- 密碼為 Admin123! 的 bcrypt hash（僅供開發用）
INSERT INTO users ("Id", "Email", "PasswordHash", "DisplayName", "Role", "Status", "Locale", "CreatedAt", "UpdatedAt")
VALUES (gen_random_uuid(), 'admin@example.com', '<bcrypt_hash>', 'Admin', 'admin', 'active', 'zh-TW', now(), now());
```

建議：使用 `POST /auth/register` 建立帳號後，直接在 DB 將 `Role` 改為 `admin`。

### Next.js 快取錯誤（Cannot find module './xxx.js'）

```bash
rm -rf apps/web/.next
npm run dev --prefix apps/web
```

### CORS 錯誤

檢查 `apps/api/appsettings.Development.json` 中的 `Cors:AllowedOrigins` 是否包含你的前端 port。

## 設定檔說明

| 檔案 | 用途 |
|------|------|
| `apps/api/appsettings.Development.json` | 本機 DB 連線、JWT、CORS 設定 |
| `apps/web/.env.local` | Web 前端 API URL |
| `apps/admin/.env.local` | Admin 前端 API URL |

## 相關文件

- [API v1 Contract](docs/api-v1-contract.md)
- [DB Schema v1](docs/db-schema-v1.md)
- [MVP Roadmap](docs/ootd-platform-mvp-roadmap.md)
- [Week 1 DoD Checklist](docs/week1-dod-checklist.md)
