# 36. Static export (`output: 'export'`) vs SSR — tradeoffs

## Scenario from work: "Can we host on S3 without Node?"

The CTO asks: "Netlify's free tier — let's do static export, no server." The backend lead pushes back: "The catalog changes every hour from `:8090`, the contact form runs on Server Actions, Route Handlers are our BFF — how do we do that without Node?" You open the docs: **`output: 'export'`** generates **only HTML/CSS/JS** — no SSR runtime, no dynamic server routes unless you pre-render the full list of paths.

The mock-exams shop **by default** is **SSR + Docker on :8098** ([35-docker-deploy.md](35-docker-deploy.md)). Static export is a **deliberate** tradeoff for a landing page or docs site — not for a fullstack catalog, unless you rebuild the architecture around it.

---

## What you'll learn

- What **`output: 'export'`** and the legacy **`next export`** actually do.
- What **breaks** under static export.
- **SSG vs SSR vs ISR vs static export** — a decision table.
- Hybrid setups: static marketing pages + an API on a different origin.
- When the mock-exams shop is **not** a fit for export.

---

## `output: 'export'` — how it works

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // images: { unoptimized: true }, // required for export
};

export default nextConfig;
```

```bash
npm run build
# produces out/ instead of the server-centric .next standalone
```

```text
out/
  index.html
  catalog.html          # or catalog/index.html
  _next/static/...
```

Hosting: **S3 + CloudFront**, GitHub Pages, nginx with `root /usr/share/nginx/html` — **no** `node server.js` involved.

---

## What does NOT work with static export

| Feature | Static export |
|---------|---------------|
| SSR on demand | ❌ |
| ISR (`revalidate`) | ❌ |
| Route Handlers `app/api/*` | ❌ |
| Server Actions | ❌ |
| Middleware (dynamic) | ❌ limited |
| `cookies()`, `headers()` dynamic | ❌ |
| `next/image` default optimizer | ❌ → `unoptimized: true` |
| Dynamic routes without `generateStaticParams` | ❌ must pre-render all paths |

Any **server-side** logic in the shop ([14-server-fetch.md](14-server-fetch.md), [19-route-handlers.md](19-route-handlers.md), [21-server-actions.md](21-server-actions.md)) has to be **moved** to one of:

- client-side `fetch` against `:8090` (hello, CORS!), or
- an external BFF (Node.js on :8096), or
- build-time fetch only (data is **frozen** at build time)

---

## SSG vs SSR vs ISR vs export

| Mode | When it renders | Node server | Data |
|------|------------------|-------------|------|
| **SSG** | build time | optional (CDN static) | snapshot at build |
| **ISR** | build + periodic revalidate | **yes** | refreshes on interval |
| **SSR** | each request | **yes** | fresh |
| **static export** | build only | **no** | frozen until rebuild |

```tsx
// ISR (NOT export)
fetch(url, { next: { revalidate: 60 } });

// SSR dynamic
fetch(url, { cache: "no-store" });

// SSG
fetch(url, { cache: "force-cache" });
```

Static export is basically **pure SSG** applied to every pre-renderable page.

---

## Dynamic routes under export

You need the **full list** of params at build time:

```tsx
// app/items/[id]/page.tsx
export async function generateStaticParams() {
  const res = await fetch("http://localhost:8090/api/v1/items");
  const items: { id: number }[] = await res.json();
  return items.map((item) => ({ id: String(item.id) }));
}
```

A **new product** added to the API after deploy → **404** on the static host until you rebuild. For a catalog with frequent changes, that's **unacceptable** without a CI rebuild triggered by a webhook.

---

## Shop catalog: the SSR path (mock-exams recommendation)

```text
Browser → Next.js :8098 (SSR)
              ↓ server fetch
          FastAPI :8090
```

Advantages:

- Fresh catalog with no rebuild
- Route Handlers keep API keys hidden
- Server Actions for the contact form ([22-lab-server-actions.md](22-lab-server-actions.md))
- `generateMetadata` with live data ([31-metadata-seo.md](31-metadata-seo.md))
- Docker standalone build ([35-docker-deploy.md](35-docker-deploy.md))

---

## Static export path (if we were building a landing page)

```text
Browser → CDN static HTML/JS
              ↓ client fetch (CORS)
          FastAPI :8090
```

Advantages:

- Cheap hosting, scales trivially since it's static
- No Node ops burden

Drawbacks for the shop:

- CORS on `:8090` ([react-basic/18-cors-fastapi](../react-basic/18-cors-fastapi.md))
- API URL baked into the client bundle
- No Server Actions — the form needs a separate POST API
- Catalog SEO is fine only if you pre-render **every** item at build time
- The cart is purely client-side (that part's fine)

---

## Hybrid architecture

| Part | Hosting |
|------|---------|
| Marketing `/`, `/about` | static export / CMS |
| `/catalog`, `/items/*` | SSR Next on :8098 |
| Admin | Django :8092 |

Two deployments, or a monorepo with a split build — either way, extra ops complexity.

---

## `images.unoptimized`

```ts
const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};
```

Or a custom CDN loader. Without one of these, the build fails.

---

## Middleware and export

Middleware with redirects/locale handling does **not** work the same way as on a server — check the docs for your Next version. i18n `[locale]` ([33-i18n-overview.md](33-i18n-overview.md)) on pure static needs a client-side redirect or hosting-level rules.

---

## Decision matrix for mock-exams

| Requirement | SSR Docker | Static export |
|------------|------------|---------------|
| Live catalog from :8090 | ✅ | ❌ without client + CORS |
| Server Actions for contact | ✅ | ❌ |
| Route Handlers BFF | ✅ | ❌ |
| Deploy on :8098 | ✅ | a different host |
| S3-only infra | ❌ | ✅ |
| New products without rebuild | ✅ | ❌ |

**Capstone [39-capstone.md](39-capstone.md)** uses the SSR path.

---

## Migrating SSR → export (if forced to)

1. Remove Route Handlers / Server Actions → switch to a REST client.
2. Enable CORS on FastAPI.
3. Add `generateStaticParams` for every `[id]`.
4. Wire a CI webhook to rebuild on catalog changes.
5. Set `images.unoptimized: true`.
6. Accept a frozen contact form → have the client POST to the API directly.

The reverse migration, export → SSR, is simpler: drop `output: 'export'`, deploy with Docker.

---

## Common mistakes

**Thinking export = "free SSR"** — it is **not**; there's no server.

**Forgetting `generateStaticParams`** — build fails on dynamic routes.

**ISR on export** — not supported.

**A secret API key in a client fetch** after switching to export — that's a security leak.

**Dynamic OG metadata** — only build-time data is available.

**Preview/staging without a rebuild** — stale prices on the static site.

**Mixed config** of `standalone` + `export` — these output modes are mutually exclusive.

---

## Summary

**`output: 'export'`** gives you a pure static site from the build, **with no Node runtime**. The tradeoff: simple, cheap hosting versus **no** SSR, API routes, Server Actions, or live catalog. The mock-exams shop, with its FastAPI BFF and Docker on **:8098**, is **SSR + standalone** — not export.

---

## Checklist

- [ ] What ends up in `out/` vs `.next/standalone`
- [ ] The list of features incompatible with export
- [ ] The role of `generateStaticParams` under export
- [ ] Why `images.unoptimized` is needed
- [ ] SSR vs ISR vs export — when to use which
- [ ] Why the capstone chooses SSR
- [ ] The CORS implications of client-only fetch

Next lesson: [37. Lab: Docker image locally](37-lab-docker.md).
