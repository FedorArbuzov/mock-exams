# 36. Production build, env, and preview behind nginx

## A story from work

The dev `npm run dev` on `:5174` flies; the PM asks you to "deploy the admin SPA to staging". You run `npm run build`, open `dist/index.html` with a double-click — a blank page. Console: `Failed to load module` — wrong base path. Then on staging: API calls go to `localhost:8092` for every user. DevOps: "We need build-time env, static behind nginx, an API proxy, gzip, and cache headers."

This chapter closes the path from the Vite dev server to a **production artifact** of the admin SPA.

## What you'll learn

- `vite build`, `preview`, bundle analysis
- Environment variables: dev vs staging vs prod
- `base` path for a subdirectory deploy
- nginx config: SPA fallback, API proxy, caching
- A CI checklist for the frontend

---

## Vite build pipeline

```bash
cd courses/react-intermediate/examples
npm run build    # tsc -b && vite build → dist/
npm run preview  # local prod serve :4173
```

| Script | Purpose |
|--------|------------|
| `dev` | HMR, source maps, MSW optional |
| `build` | minify, tree-shake, hash filenames |
| `preview` | verify prod bundle locally |

Output:

```text
dist/
├── index.html
├── assets/
│   ├── index-a1b2c3.js
│   └── index-d4e5f6.css
└── favicon.ico
```

Hashed assets → **long cache**; `index.html` → **no cache** or short TTL.

---

## Environment variables

Vite injects them at **build time**:

```tsx
const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8092";
const useMsw = import.meta.env.VITE_USE_MSW === "true";
```

`.env` files:

```env
# .env.development
VITE_API_URL=http://localhost:8092
VITE_USE_MSW=true

# .env.production
VITE_API_URL=https://api.shop.example
VITE_USE_MSW=false
```

`.env.staging` + `vite build --mode staging` for an intermediate environment.

**Never** commit `.env` with secrets — only `.env.example`:

```env
VITE_API_URL=http://localhost:8092
VITE_USE_MSW=false
```

See [35-security-client.md](35-security-client.md).

---

## Type-safe env (optional)

```tsx
// vite-env.d.ts
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_USE_MSW: string;
}
```

Runtime validation:

```tsx
const url = import.meta.env.VITE_API_URL;
if (!url && import.meta.env.PROD) {
  throw new Error("VITE_API_URL is required in production");
}
```

---

## Base path and Router

Deploy at `https://company.com/admin/`, not the root:

```ts
// vite.config.ts
export default defineConfig({
  base: "/admin/",
});
```

```tsx
// BrowserRouter
<BrowserRouter basename="/admin">
```

A forgotten `basename` → routes 404 behind nginx.

---

## nginx: static SPA + API proxy

```nginx
server {
  listen 80;
  server_name admin.shop.local;
  root /usr/share/nginx/html;
  index index.html;

  # API → Django
  location /api/ {
    proxy_pass http://django:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }

  # Hashed assets — long cache
  location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  # SPA fallback
  location / {
    try_files $uri $uri/ /index.html;
  }

  gzip on;
  gzip_types text/css application/javascript application/json;
}
```

Same-origin `/api/` — **no CORS** pain in prod (BFF/proxy pattern). Dev may still use `:8092` cross-origin + CORS.

Related: [deploy/nginx](../../deploy/nginx/README.md).

---

## MSW in production

**Default: OFF.** MSW bootstraps only in dev/test:

```tsx
async function enableMocking() {
  if (import.meta.env.PROD || import.meta.env.VITE_USE_MSW !== "true") return;
  const { worker } = await import("./mocks/browser");
  return worker.start({ onUnhandledRequest: "bypass" });
}
```

A demo staging without a backend is a deliberate exception, not prod.

---

## Bundle analysis

```bash
npm install -D rollup-plugin-visualizer
```

```ts
// vite.config.ts
import { visualizer } from "rollup-plugin-visualizer";

plugins: [
  visualizer({ open: true, filename: "stats.html" }),
],
```

Look for: duplicate lodash, whole-library imports (`import _ from 'lodash'` → `lodash/es/map`).

Code splitting is already in [21-code-splitting.md](21-code-splitting.md) — verify chunks in stats.

---

## Source maps

```ts
build: {
  sourcemap: true, // or 'hidden' for Sentry upload without public maps
},
```

Public source maps in prod — they leak the source structure; use hidden + Sentry.

---

## CI pipeline sketch

```yaml
# .gitlab-ci.yml fragment
frontend-build:
  script:
    - cd courses/react-intermediate/examples
    - npm ci
    - npm run build
  artifacts:
    paths:
      - courses/react-intermediate/examples/dist/
```

Gates:

- `npm run build` zero errors
- `tsc --noEmit` if separate
- (optional) `npm run test`
- Lighthouse CI on the preview URL

---

## Health check integration

Admin SPA footer:

```tsx
const { data } = useQuery({
  queryKey: ["health"],
  queryFn: () => fetch("/health/").then((r) => r.json()),
  staleTime: 60_000,
  retry: false,
});
```

Ops sees API status next to the UI version `import.meta.env.VITE_APP_VERSION`.

---

## Lab (short version)

1. `npm run build && npm run preview` — the full auth + products flow works.
2. `.env.production` with the staging API URL (or a proxy).
3. (Optional) docker nginx serving `dist/` + proxy `/api/` → `:8092`.

**Success criterion:** a hard refresh on `/products/5` is not a 404 (SPA fallback); assets are cached.

---

## Common mistakes

1. **Open index.html file://** — ES modules need an HTTP server.

2. **API URL hardcoded to localhost** in the prod build.

3. **Forgot basename** with a subdirectory deploy.

4. **Cache index.html aggressively** — users stuck on the old bundle after a deploy.

5. **MSW enabled in prod** — fake data in production.

6. **No gzip/brotli** — slow first load on a mobile VPN.

---

## Checklist

- [ ] `npm run build` succeeds; preview smoke test
- [ ] `VITE_*` documented in `.env.example`
- [ ] `basename` + vite `base` aligned if not a root deploy
- [ ] nginx try_files → index.html
- [ ] API proxy or correct CORS prod URL
- [ ] MSW disabled in production
- [ ] Asset cache headers; index.html short cache
- [ ] CI builds the artifact on every merge

---

[← 35-security-client](35-security-client.md) · [37-profiler →](37-profiler.md)
