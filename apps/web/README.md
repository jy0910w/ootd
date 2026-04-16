# OOTD Web (Week 1 Integration)

## Run locally

1. Copy env file:

```bash
cp .env.local.example .env.local
```

2. Install dependencies:

```bash
npm install
```

3. Start dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Notes
- MVP routes:
  - `/login`
  - `/wardrobe`
  - `/outfits`
  - `/outfits/new`
  - `/recommendations`
- Legacy integration harness kept at `/_integration`.
- The harness exercises Auth, Items, and Recommendations APIs.
- API must be running on `NEXT_PUBLIC_API_BASE_URL`.
- Dev/build scripts sanitize `NODE_OPTIONS`/`npm_config_node_options`, remove `--localstorage-file`, and force `--no-experimental-webstorage` to prevent `localStorage.getItem is not a function` crashes in Next.js dev runtime.
