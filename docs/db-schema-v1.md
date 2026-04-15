# OOTD DB Schema v1 (PostgreSQL)

## 1. 文件目的
- 定義 MVP v1 可直接實作的資料庫 schema 基準。
- 提供 `apps/api` 實作 EF Core entity 與 migration 的對照。

## 2. 設計原則
- 主鍵使用 UUID（`uuid`）
- 重要 enum 使用 `varchar` + constrained value（或後續轉 native enum）
- 所有 FK 建 index
- 所有可更新資料表含 `created_at`、`updated_at`
- 優先 soft delete（必要時增加 `status` 欄位）

## 3. 資料表與關聯

### 3.1 users
用途：帳號與角色資訊

欄位：
- `id uuid pk`
- `email varchar(320) not null unique`
- `password_hash varchar(255) null`（OAuth-only 可為 null）
- `display_name varchar(100) not null`
- `role varchar(20) not null`（`user|moderator|admin`）
- `status varchar(20) not null default 'active'`（`active|banned`）
- `style_preferences jsonb null`
- `locale varchar(20) not null default 'zh-TW'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

索引/約束：
- `uq_users_email (email)`
- `idx_users_role (role)`

### 3.2 items
用途：使用者衣櫥單品

欄位：
- `id uuid pk`
- `user_id uuid not null fk -> users(id)`
- `name varchar(120) not null`
- `category varchar(30) not null`
- `color varchar(30) not null`
- `style_tags jsonb null`
- `image_url text not null`
- `status varchar(20) not null default 'active'`（`active|archived`）
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

索引/約束：
- `idx_items_user_id (user_id)`
- `idx_items_category (category)`
- `idx_items_status (status)`

### 3.3 outfits
用途：使用者穿搭貼文

欄位：
- `id uuid pk`
- `user_id uuid not null fk -> users(id)`
- `title varchar(140) not null`
- `description text null`
- `occasion varchar(30) not null`
- `season varchar(20) not null`
- `weather_range varchar(30) null`
- `image_urls jsonb not null`
- `moderation_status varchar(20) not null default 'pending'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

索引/約束：
- `idx_outfits_user_id (user_id)`
- `idx_outfits_moderation_created (moderation_status, created_at desc)`

### 3.4 outfit_items
用途：穿搭與單品多對多關聯

欄位：
- `id uuid pk`
- `outfit_id uuid not null fk -> outfits(id)`
- `item_id uuid not null fk -> items(id)`
- `created_at timestamptz not null default now()`

索引/約束：
- `idx_outfit_items_outfit_id (outfit_id)`
- `idx_outfit_items_item_id (item_id)`
- `uq_outfit_item_pair (outfit_id, item_id)`

### 3.5 recommendation_logs
用途：推薦請求與結果追蹤

欄位：
- `id uuid pk`
- `user_id uuid not null fk -> users(id)`
- `input_item_ids jsonb not null`
- `context jsonb not null`（occasion/weather/styleHints）
- `result_outfit_ids jsonb not null`
- `latency_ms int not null`
- `created_at timestamptz not null default now()`

索引/約束：
- `idx_recommendation_logs_user_created (user_id, created_at desc)`

### 3.6 feedback
用途：推薦結果有幫助回饋

欄位：
- `id uuid pk`
- `user_id uuid not null fk -> users(id)`
- `recommendation_id uuid not null fk -> recommendation_logs(id)`
- `helpful boolean not null`
- `reason varchar(500) null`
- `created_at timestamptz not null default now()`

索引/約束：
- `idx_feedback_user_id (user_id)`
- `idx_feedback_recommendation_id (recommendation_id)`

### 3.7 moderation_actions
用途：後台審核與封禁審計

欄位：
- `id uuid pk`
- `target_type varchar(20) not null`（`outfit|user`）
- `target_id uuid not null`
- `action varchar(30) not null`（`approve|reject|ban|unban`）
- `operator_user_id uuid not null fk -> users(id)`
- `note varchar(500) null`
- `created_at timestamptz not null default now()`

索引/約束：
- `idx_moderation_actions_target (target_type, target_id, created_at desc)`
- `idx_moderation_actions_operator (operator_user_id, created_at desc)`

## 4. 參考 SQL DDL（可作 migration 對照）

```sql
create table users (
  id uuid primary key,
  email varchar(320) not null unique,
  password_hash varchar(255),
  display_name varchar(100) not null,
  role varchar(20) not null,
  status varchar(20) not null default 'active',
  style_preferences jsonb,
  locale varchar(20) not null default 'zh-TW',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table items (
  id uuid primary key,
  user_id uuid not null references users(id),
  name varchar(120) not null,
  category varchar(30) not null,
  color varchar(30) not null,
  style_tags jsonb,
  image_url text not null,
  status varchar(20) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table outfits (
  id uuid primary key,
  user_id uuid not null references users(id),
  title varchar(140) not null,
  description text,
  occasion varchar(30) not null,
  season varchar(20) not null,
  weather_range varchar(30),
  image_urls jsonb not null,
  moderation_status varchar(20) not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table outfit_items (
  id uuid primary key,
  outfit_id uuid not null references outfits(id),
  item_id uuid not null references items(id),
  created_at timestamptz not null default now(),
  unique (outfit_id, item_id)
);

create table recommendation_logs (
  id uuid primary key,
  user_id uuid not null references users(id),
  input_item_ids jsonb not null,
  context jsonb not null,
  result_outfit_ids jsonb not null,
  latency_ms int not null,
  created_at timestamptz not null default now()
);

create table feedback (
  id uuid primary key,
  user_id uuid not null references users(id),
  recommendation_id uuid not null references recommendation_logs(id),
  helpful boolean not null,
  reason varchar(500),
  created_at timestamptz not null default now()
);

create table moderation_actions (
  id uuid primary key,
  target_type varchar(20) not null,
  target_id uuid not null,
  action varchar(30) not null,
  operator_user_id uuid not null references users(id),
  note varchar(500),
  created_at timestamptz not null default now()
);

create index idx_items_user_id on items(user_id);
create index idx_outfits_moderation_created on outfits(moderation_status, created_at desc);
create index idx_recommendation_logs_user_created on recommendation_logs(user_id, created_at desc);
create index idx_moderation_actions_target on moderation_actions(target_type, target_id, created_at desc);
```

## 5. Migration 流程建議
- 建立 migration：`dotnet ef migrations add <Name> --project apps/api/OotdPlatform.Api.csproj`
- 套用 migration：`dotnet ef database update --project apps/api/OotdPlatform.Api.csproj`
- 上線前檢查：
  - migration list 與 `__EFMigrationsHistory` 一致
  - staging 可重放
  - rollback 路徑有測過

## 6. Week 1 DB 驗收最低門檻
- 初始 schema 含 7 張核心表。
- FK 與主要索引已建立。
- migration 可在 local 套用成功。
- API 啟動時可正常連線 DB 並完成基本 CRUD。
