# 34. Production build: `next build`, standalone, bundle analysis

## A scenario from work: "It's all fine in dev, prod is 502 and an 800 MB image"

DevOps: "`npm run dev` isn't for production. The image is 1.2 GB, startup takes 40 seconds, and the logs show the entire `node_modules`." You run `next build` for the first time — warnings about **large client bundles**, **middleware** edge size, a missing **`output: 'standalone'`** for Docker ([35-docker-deploy.md](35-docker-deploy.md)).

The shop Next.js app on `:8098` should start fast, not drag in devDependencies, and be able to **SSR** to FastAPI `:8090` at runtime — which means **not** a static export ([36-static-export.md](36-static-export.md)).

---

## What you'll learn

- What **`next build`** does and how it differs from `dev`.
- **`output: 'standalone'`** for a minimal Docker runtime.
- **`next start`** vs a custom server.
- Bundle analysis: **@next/bundle-analyzer**, Turbopack insights.
- Env vars: `NEXT_PUBLIC_*` vs server-only at build time.
- Typical prod-only bugs.

---

## The production lifecycle

```text
next build   → .next/ (optimized server + static + manifests)
next start   → Node HTTP server, SSR/ISR
```

```json
// package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start -p 8098",
    "analyze": "ANALYZE=true next build"
  }
}
```

| Command | Purpose |
|---------|------------|
| `next dev` | HMR, verbose errors, **not** prod perf |
| `next build` | compile, tree-shake, static generation |
| `next start` | serve `.next` in production |

**Never** run `next dev` behind nginx in prod.

---

## What `next build` creates

```text
.next/
  standalone/          # with output: 'standalone'
  static/              # hashed JS/CSS assets
  server/              # server bundles
  BUILD_ID
  routes-manifest.json
```

The build log shows:

- **Route (app)** — ○ static, λ dynamic, ƒ server action
- **First Load JS** per route — client bundle size
- **Middleware** size — the edge limit

Example line:

```text
Route (app)                              Size     First Load JS
┌ ○ /                                    142 B          87 kB
├ λ /catalog                             1.2 kB         102 kB
├ λ /items/[id]                          890 B          101 kB
└ ○ /_not-found                          142 B          87 kB
```

- **○ (Static)** — prerendered at build
- **λ (Dynamic)** — server-rendered on request
- **ƒ** — server actions / special

The shop catalog with `fetch` without `cache: 'force-cache'` is often **dynamic** — that's normal for SSR to an API.

---

## `output: 'standalone'`

For Docker ([35-docker-deploy.md](35-docker-deploy.md)), enable it in `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // rewrites, images — as before
};

export default nextConfig;
```

After build:

```text
.next/standalone/
  server.js
  node_modules/     # only traced dependencies
  .next/            # minimal server artifacts
```

**Trace** analyzes imports and copies **only the needed** files from `node_modules`. The image drops from ~1 GB to typically ~150–250 MB.

Runtime in the container:

```dockerfile
CMD ["node", "server.js"]
# listens on the PORT env, default 3000
```

Also copy `public/` and `.next/static` into the image — standalone does **not** include them automatically in one folder (see the Dockerfile in chapter 35).

---

## Environment variables at build

| Variable | When embedded |
|----------|-------------|
| `NEXT_PUBLIC_*` | **build time** — into the client JS |
| `FASTAPI_URL` (server) | **runtime** — read in Server Components / Route Handlers |
| `NEXT_PUBLIC_SITE_URL` | build — OG URLs if hardcoded in the client |

**Mistake:** a CI build with `NEXT_PUBLIC_API=http://localhost:8090` → the prod client hits localhost.

The mock-exams pattern:

```env
# runtime in Docker
FASTAPI_URL=http://fastapi:8090
NEXT_PUBLIC_SITE_URL=https://shop.example.com
```

Server fetch uses `FASTAPI_URL`; client islands use the BFF Route Handlers ([20-lab-route-handlers.md](20-lab-route-handlers.md)), not `:8090` directly.

---

## Bundle size analysis

### @next/bundle-analyzer

```bash
npm install -D @next/bundle-analyzer
```

```ts
// next.config.ts
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer(nextConfig);
```

```bash
ANALYZE=true npm run build
# opens a treemap of the client bundles
```

**Look for:** the entire `lodash`, `moment`, duplicate `@tanstack/query` chunks, an accidental **server-only** import across the client boundary.

### What bloats the shop client bundle

| Cause | Fix |
|---------|-----|
| `"use client"` on the layout | move the boundary lower |
| Importing server utils into the client | split out `lib/server/` |
| A heavy chart library on the catalog | dynamic `import()` |
| All icons from `@mui/icons-material` | tree-shake or use SVG |

```tsx
// dynamic import, client-only
import dynamic from "next/dynamic";

const CartDrawer = dynamic(() => import("@/features/cart/CartDrawer"), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});
```

---

## Compiler options (overview)

```ts
const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  compress: true,
  experimental: {
    // follow the Next 15 changelog
  },
};
```

`reactStrictMode: true` — dev double render; prod unaffected.

---

## Checking the build locally

```bash
cd courses/nextjs-basic/examples
npm run build
npm run start
# http://localhost:8098 if -p 8098
curl -I http://localhost:8098/catalog
```

Checklist after build:

1. No TypeScript errors — the build fails on TS by default.
2. Dynamic routes work with the runtime env `FASTAPI_URL`.
3. Static assets return 200 (`/_next/static/...`).
4. Middleware doesn't exceed the size limit.

---

## Build vs runtime errors

| Symptom | Cause |
|---------|---------|
| Works in dev, 500 in prod | env missing at runtime |
| Empty catalog in prod | `FASTAPI_URL` wrong network in Docker |
| Client calls localhost | `NEXT_PUBLIC_*` baked wrong |
| `Dynamic server usage` error | `cookies()` in a static page without `dynamic = 'force-dynamic'` |

```tsx
// force dynamic if needed
export const dynamic = "force-dynamic";
```

Use it **surgically** — you lose static optimization.

---

## Monorepo and CI

In GitLab CI ([gitlab-basic](../gitlab-basic/README.md)):

```yaml
build-nextjs:
  script:
    - cd courses/nextjs-basic/examples
    - npm ci
    - npm run build
  artifacts:
    paths:
      - courses/nextjs-basic/examples/.next/
```

The Docker build is often **multi-stage**: deps → build → runtime ([35-docker-deploy.md](35-docker-deploy.md)).

---

## Common mistakes

**Deploying `.next` without `next start`** — you need a Node server for SSR.

**Copying the whole repo in Docker** without standalone — a huge image.

**Building on Mac, running on Linux** — native modules mismatch; build in CI on Linux.

**Ignoring build warnings about First Load JS 500kB+** — UX suffers on mobile.

**`output: 'export'` by accident** — breaks SSR/API routes ([36-static-export.md](36-static-export.md)).

**Analyzing only one route** — look at the shared chunks.

**Forgetting `public/` in Docker** — missing favicon/og.

---

## Summary

**`next build`** prepares an optimized `.next/`; **`output: 'standalone'`** is a minimal traced runtime for Docker. **`next start`** on port **8098** for mock-exams. Analyze **First Load JS** and the bundle analyzer before DevOps sees an 800 MB image.

---

## Checklist

- [ ] The difference between dev / build / start
- [ ] Why `output: 'standalone'`
- [ ] Build-time vs runtime env
- [ ] ○ vs λ in the build output
- [ ] How to run the bundle analyzer
- [ ] What to copy into Docker besides standalone
- [ ] When to use `dynamic = 'force-dynamic'`

Next lesson: [35. Docker: multi-stage and deploy/nextjs](35-docker-deploy.md).
