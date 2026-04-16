# OOTD Admin (MVP Skeleton)

## Run locally

1. Copy env file:

```bash
cp .env.local.example .env.local
```

2. Install dependencies:

```bash
npm install
```

3. Start dev server (recommend port 3001):

```bash
npm run dev -- --port 3001
```

Open `http://localhost:3001`.

## Routes

- `/login`
- `/dashboard`
- `/moderation`
- `/users` (admin only)

## Notes

- Uses API from `NEXT_PUBLIC_API_BASE_URL`.
- Login requires `admin` or `moderator` role.
- `Users` page allows `ban/unban` for admin only.
