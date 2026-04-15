# OOTD API v1 Contract

## 1. 文件目的
- 提供 `apps/api`、`apps/web`、`apps/admin` 可直接對接的 API 契約基準。
- 本文件以 MVP v1 為範圍，優先確保可開發、可驗收、可追蹤。

## 2. 全域規範

### 2.1 Base URL
- `http://localhost:5050/api/v1`（local compose）

### 2.2 認證
- 使用 `Bearer JWT`：`Authorization: Bearer <access_token>`
- `access_token` 建議短效（15-30 分鐘），`refresh_token` 建議長效（7-30 天）

### 2.3 回應格式
- 成功：直接回傳資源 JSON 或 `{ "success": true }`
- 失敗：統一錯誤格式

```json
{
  "code": "VALIDATION_ERROR",
  "message": "欄位驗證失敗",
  "details": [
    { "field": "email", "reason": "invalid_format" }
  ],
  "traceId": "b73e6a2f-8a63-4f0b-a6df-d2237f77a1c5"
}
```

### 2.4 常用 status code
- `200 OK`：查詢/更新成功
- `201 Created`：建立成功
- `204 No Content`：刪除成功
- `400 Bad Request`：請求格式錯誤
- `401 Unauthorized`：未登入或 token 無效
- `403 Forbidden`：角色權限不足
- `404 Not Found`：資源不存在
- `409 Conflict`：唯一鍵或狀態衝突
- `422 Unprocessable Entity`：欄位驗證不通過
- `500 Internal Server Error`：系統錯誤

### 2.5 分頁規格
- Query 參數：`page`（預設 1）、`pageSize`（預設 20，最大 100）
- 回應包裝：

```json
{
  "items": [],
  "page": 1,
  "pageSize": 20,
  "total": 128
}
```

## 3. Domain: Auth

### POST `/auth/register`
- 權限：公開

Request
```json
{
  "email": "user@example.com",
  "password": "P@ssw0rd123",
  "displayName": "Ariel"
}
```

Response `201`
```json
{
  "user": {
    "id": "1f4d6ba0-7ca6-45b8-ab77-370d6c75994b",
    "email": "user@example.com",
    "displayName": "Ariel",
    "role": "user"
  },
  "accessToken": "<jwt>",
  "refreshToken": "<refresh_token>"
}
```

### POST `/auth/login`
- 權限：公開

Request
```json
{
  "email": "user@example.com",
  "password": "P@ssw0rd123"
}
```

Response `200`：同 `/auth/register`

### POST `/auth/refresh`
- 權限：公開

Request
```json
{
  "refreshToken": "<refresh_token>"
}
```

Response `200`
```json
{
  "accessToken": "<new_jwt>",
  "refreshToken": "<new_refresh_token>"
}
```

### POST `/auth/logout`
- 權限：已登入

Request
```json
{
  "refreshToken": "<refresh_token>"
}
```

Response `200`
```json
{ "success": true }
```

## 4. Domain: Me

### GET `/me`
- 權限：`user|moderator|admin`

Response `200`
```json
{
  "id": "1f4d6ba0-7ca6-45b8-ab77-370d6c75994b",
  "email": "user@example.com",
  "displayName": "Ariel",
  "role": "user",
  "stylePreferences": ["minimal", "smart-casual"],
  "locale": "zh-TW"
}
```

### PATCH `/me`
- 權限：`user|moderator|admin`

Request
```json
{
  "displayName": "Ariel Lin",
  "stylePreferences": ["minimal", "street"],
  "locale": "zh-TW"
}
```

Response `200`：同 `GET /me`

## 5. Domain: Items

### GET `/items`
- 權限：`user|moderator|admin`
- Query：`category`、`color`、`page`、`pageSize`

### POST `/items`
- 權限：`user|moderator|admin`

Request
```json
{
  "name": "白色牛津襯衫",
  "category": "top",
  "color": "white",
  "styleTags": ["minimal", "formal"],
  "imageUrl": "https://cdn.example.com/items/white-shirt.jpg"
}
```

Response `201`
```json
{
  "id": "f6b9c450-e9f2-486c-937c-b9c89cd8dcd4",
  "userId": "1f4d6ba0-7ca6-45b8-ab77-370d6c75994b",
  "name": "白色牛津襯衫",
  "category": "top",
  "color": "white",
  "styleTags": ["minimal", "formal"],
  "imageUrl": "https://cdn.example.com/items/white-shirt.jpg",
  "status": "active",
  "createdAt": "2026-04-15T10:00:00Z",
  "updatedAt": "2026-04-15T10:00:00Z"
}
```

### GET `/items/{id}`
- 權限：owner 或 `admin`

### PATCH `/items/{id}`
- 權限：owner 或 `admin`

### DELETE `/items/{id}`
- 權限：owner 或 `admin`
- 行為：soft delete（`status=archived`）

## 6. Domain: Outfits

### GET `/outfits/mine`
- 權限：`user|moderator|admin`

### POST `/outfits`
- 權限：`user|moderator|admin`

Request
```json
{
  "title": "上班簡約通勤",
  "description": "白襯衫搭配深藍寬褲",
  "occasion": "work",
  "season": "spring",
  "weatherRange": "18-24",
  "imageUrls": [
    "https://cdn.example.com/outfits/1.jpg"
  ],
  "itemIds": [
    "f6b9c450-e9f2-486c-937c-b9c89cd8dcd4"
  ]
}
```

Response `201`
```json
{
  "id": "9ca31238-35ae-40ef-a4b3-18f6de2dc5af",
  "moderationStatus": "pending"
}
```

### GET `/outfits/{id}`
- 權限：公開（僅 `approved`）或 owner 或 `moderator|admin`

### PATCH `/outfits/{id}`
- 權限：owner 或 `admin`

### DELETE `/outfits/{id}`
- 權限：owner 或 `admin`

## 7. Domain: Recommendations

### POST `/recommendations/query`
- 權限：`user|moderator|admin`

Request
```json
{
  "itemIds": ["f6b9c450-e9f2-486c-937c-b9c89cd8dcd4"],
  "occasion": "work",
  "season": "spring",
  "weather": "20",
  "styleHints": ["minimal", "clean"]
}
```

Response `200`
```json
{
  "recommendationId": "b9b6d6e2-3b18-4fbc-b2ec-e6db2c22925b",
  "results": [
    {
      "outfitId": "9ca31238-35ae-40ef-a4b3-18f6de2dc5af",
      "score": 0.87,
      "reasons": ["同為通勤場合", "色系相容", "季節相符"]
    }
  ]
}
```

### GET `/recommendations/{id}`
- 權限：owner 或 `admin`

## 8. Domain: Feedback

### POST `/feedback`
- 權限：`user|moderator|admin`

Request
```json
{
  "recommendationId": "b9b6d6e2-3b18-4fbc-b2ec-e6db2c22925b",
  "helpful": true,
  "reason": "配色有參考價值"
}
```

Response `201`
```json
{
  "id": "f6465357-9ad0-4366-8f24-92e2283376a0",
  "success": true
}
```

## 9. Domain: Admin Moderation

### GET `/admin/moderation/outfits`
- 權限：`moderator|admin`
- Query：`status=pending|approved|rejected`、`page`、`pageSize`

### POST `/admin/moderation/outfits/{id}/approve`
- 權限：`moderator|admin`

Response `200`
```json
{ "success": true }
```

### POST `/admin/moderation/outfits/{id}/reject`
- 權限：`moderator|admin`

Request
```json
{
  "reason": "不符合社群規範"
}
```

### GET `/admin/users`
- 權限：`admin`

### POST `/admin/users/{id}/ban`
- 權限：`admin`

### POST `/admin/users/{id}/unban`
- 權限：`admin`

## 10. Health

### GET `/health/live`
- 權限：公開
- 用途：容器存活檢查

### GET `/health/ready`
- 權限：公開
- 用途：依賴（DB）可用檢查

## 11. Enum 建議值
- `role`: `user`, `moderator`, `admin`
- `item.category`: `top`, `bottom`, `outer`, `shoes`, `accessory`, `dress`
- `outfit.occasion`: `work`, `date`, `casual`, `formal`, `sport`, `travel`
- `outfit.season`: `spring`, `summer`, `autumn`, `winter`, `all`
- `outfit.moderationStatus`: `pending`, `approved`, `rejected`

## 12. Week 1 API 驗收最低門檻
- Auth 三支（register/login/refresh）可用。
- `POST /items`、`POST /outfits`、`POST /recommendations/query` 可打通。
- Admin 可透過 `/admin/moderation/outfits?status=pending` 讀到資料。
- 所有失敗回應符合統一錯誤格式。
