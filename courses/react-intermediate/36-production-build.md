# 36. Production build, env и preview за nginx

## Сценарий с работы

Dev `npm run dev` на `:5174` летает; PM просит «задеплоить admin SPA на staging». Вы делаете `npm run build`, открываете `dist/index.html` двойным кликом — blank page. Console: `Failed to load module` — wrong base path. Потом staging: API calls идут на `localhost:8092` у всех пользователей. DevOps: «Нужны env на build time, static за nginx, API proxy, gzip, cache headers».

Эта глава закрывает путь от Vite dev server до **production artifact** admin SPA.

## Что вы узнаете

- `vite build`, `preview`, анализ bundle
- Environment variables: dev vs staging vs prod
- `base` path для subdirectory deploy
- nginx config: SPA fallback, API proxy, caching
- CI checklist для frontend

---

## Vite build pipeline

```bash
cd courses/react-intermediate/examples
npm run build    # tsc -b && vite build → dist/
npm run preview  # local prod serve :4173
```

| Script | Назначение |
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

Hashed assets → **long cache**; `index.html` → **no cache** или short TTL.

---

## Environment variables

Vite injects at **build time**:

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

`.env.staging` + `vite build --mode staging` для промежуточного окружения.

**Never** commit `.env` with secrets — only `.env.example`:

```env
VITE_API_URL=http://localhost:8092
VITE_USE_MSW=false
```

См. [35-security-client.md](35-security-client.md).

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

## Base path и Router

Deploy at `https://company.com/admin/` not root:

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

Forgotten `basename` → routes 404 behind nginx.

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

Связь: [deploy/nginx](../../deploy/nginx/README.md).

---

## MSW в production

**Default: OFF.** MSW bootstrap только dev/test:

```tsx
async function enableMocking() {
  if (import.meta.env.PROD || import.meta.env.VITE_USE_MSW !== "true") return;
  const { worker } = await import("./mocks/browser");
  return worker.start({ onUnhandledRequest: "bypass" });
}
```

Demo staging without backend — осознанное исключение, не prod.

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

Ищите: duplicate lodash, entire library imports (`import _ from 'lodash'` → `lodash/es/map`).

Code splitting уже в [21-code-splitting.md](21-code-splitting.md) — verify chunks in stats.

---

## Source maps

```ts
build: {
  sourcemap: true, // или 'hidden' для Sentry upload без public maps
},
```

Public source maps на prod — leak source structure; use hidden + Sentry.

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
- Lighthouse CI on preview URL

---

## Health check integration

Footer admin SPA:

```tsx
const { data } = useQuery({
  queryKey: ["health"],
  queryFn: () => fetch("/health/").then((r) => r.json()),
  staleTime: 60_000,
  retry: false,
});
```

Ops видит API status рядом с UI version `import.meta.env.VITE_APP_VERSION`.

---

## Лаба (кратко)

1. `npm run build && npm run preview` — full auth + products flow works.
2. `.env.production` с staging API URL (or proxy).
3. (Optional) docker nginx serving `dist/` + proxy `/api/` → `:8092`.

**Критерий:** hard refresh on `/products/5` не 404 (SPA fallback); assets cached.

---

## Типичные ошибки

1. **Open index.html file://** — ES modules need HTTP server.

2. **API URL hardcoded localhost** in prod build.

3. **Forgot basename** with subdirectory deploy.

4. **Cache index.html aggressively** — users stuck on old bundle after deploy.

5. **MSW enabled in prod** — fake data in production.

6. **No gzip/brotli** — slow first load on mobile VPN.

---

## Чек-лист

- [ ] `npm run build` succeeds; preview smoke test
- [ ] `VITE_*` documented in `.env.example`
- [ ] `basename` + vite `base` aligned if not root deploy
- [ ] nginx try_files → index.html
- [ ] API proxy or correct CORS prod URL
- [ ] MSW disabled in production
- [ ] Asset cache headers; index.html short cache
- [ ] CI builds artifact on every merge

---

[← 35-security-client](35-security-client.md) · [37-profiler →](37-profiler.md)
