# 21. Code splitting: `lazy`, `Suspense`, preload

## A story from work

Lighthouse on the admin SPA: **Initial JS 890 KB** — a user on `/login` downloads a chunk with the product editor, charts, and CRUD forms. The product owner: "Split the bundles by route; 5% of users open settings." Vite + React Router ([react-basic: nested routes](../react-basic/24-nested-routes.md)) + `React.lazy` is the standard pattern before [22-suspense-data.md](22-suspense-data.md) and the [23-lab-performance.md](23-lab-performance.md) lab.

The auth flow ([13-lab-auth.md](13-lab-auth.md)) should stay in the main chunk — a fast login.

## What you'll learn

- Static vs dynamic import
- `React.lazy` + `Suspense` fallback
- Route-based splitting with React Router 7
- Preload on hover / on intent
- Vite chunk names and bundle analysis
- Error handling for a failed chunk load

---

## How Vite makes chunks

```tsx
import { ProductEditorPage } from "./features/products/ProductEditorPage";
```

A static import — the code goes into the main or a shared chunk.

```tsx
const ProductEditorPage = lazy(
  () => import("./features/products/ProductEditorPage"),
);
```

A dynamic `import()` — a separate async chunk, loaded on the first render of `ProductEditorPage`.

Check: `npm run build` → `dist/assets/ProductEditorPage-xxx.js`.

---

## React.lazy basics

```tsx
import { lazy, Suspense } from "react";

const SettingsPage = lazy(() => import("@/features/settings/SettingsPage"));

export function SettingsRoute() {
  return (
    <Suspense fallback={<PageSkeleton title="Settings" />}>
      <SettingsPage />
    </Suspense>
  );
}
```

While the chunk loads — the `fallback`. After — the real component.

**lazy** only for a default export:

```tsx
// ProductEditorPage.tsx
export default function ProductEditorPage() { ... }

// or
export function ProductEditorPage() { ... }
export default ProductEditorPage;
```

A named export without a default:

```tsx
const ProductEditorPage = lazy(() =>
  import("@/features/products/ProductEditorPage").then((m) => ({
    default: m.ProductEditorPage,
  })),
);
```

---

## Route-based splitting

```tsx
// src/app/router.tsx
import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import { AdminLayout } from "./AdminLayout";
import { PageSkeleton } from "@/shared/ui/PageSkeleton";

const ProductsListPage = lazy(
  () => import("@/features/products/ProductsListPage"),
);
const ProductDetailPage = lazy(
  () => import("@/features/products/ProductDetailPage"),
);
const SettingsPage = lazy(() => import("@/features/settings/SettingsPage"));

function suspense(element: React.ReactNode) {
  return (
    <Suspense fallback={<PageSkeleton />}>{element}</Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AdminLayout />,
    children: [
      {
        path: "products",
        element: suspense(<ProductsListPage />),
      },
      {
        path: "products/:productId",
        element: suspense(<ProductDetailPage />),
      },
      {
        path: "settings",
        element: suspense(<SettingsPage />),
      },
    ],
  },
]);
```

Login route — **without** lazy, in the main bundle.

---

## Skeleton fallback

Align it with [react-basic: UI states](../react-basic/31-ui-states.md):

```tsx
export function PageSkeleton({ title }: { title?: string }) {
  return (
    <div className="page-skeleton" aria-busy="true" aria-label={title ?? "Loading"}>
      <div className="skeleton skeleton--title" />
      <div className="skeleton skeleton--block" />
    </div>
  );
}
```

Don't use `fallback={null}` on a route — the layout "jumps". An error boundary ([14-error-boundaries.md](14-error-boundaries.md)) does **not** catch suspend — only the Suspense fallback does.

---

## Preload on navigation intent

```tsx
const productDetailImport = () =>
  import("@/features/products/ProductDetailPage");

const ProductDetailPage = lazy(productDetailImport);

function ProductsListRow({ id, title }: { id: number; title: string }) {
  return (
    <Link
      to={`/products/${id}`}
      onMouseEnter={() => {
        productDetailImport(); // starts fetching the chunk
      }}
    >
      {title}
    </Link>
  );
}
```

Router 7's `lazy` route property (data router API) — an alternative; for a lazy component a duplicate import fn is enough.

**Mobile:** `onTouchStart` prefetch carefully — extra traffic.

---

## Named chunks (Vite)

```tsx
const SettingsPage = lazy(() =>
  import(
    /* webpackChunkName: "settings" */
    "@/features/settings/SettingsPage"
  ),
);
```

Vite uses `/* @vite-ignore */` less often; the `webpackChunkName` magic comment is partially supported. An explicit folder path = the chunk name in dist.

Analysis:

```bash
npm run build
npx vite-bundle-visualizer  # if you add the plugin — optional
```

---

## Failed chunk load (deploy mismatch)

After a deploy, an old tab references a removed chunk → `ChunkLoadError`. UX:

```tsx
class LazyErrorBoundary extends Component {
  // or react-error-boundary
  componentDidCatch(error: Error) {
    if (error.name === "ChunkLoadError") {
      window.location.reload();
    }
  }
}
```

A toast from [16-global-error-ux.md](16-global-error-ux.md): "A new version is available — refresh the page."

---

## What not to lazy-load

| Keep in main | Lazy candidate |
|--------------|----------------|
| Login, AuthProvider shell | Product editor |
| Router shell, QueryClient | Settings, reports |
| Shared Button, ErrorPanel | Heavy chart lib |
| MSW bootstrap ([24-msw-intro.md](24-msw-intro.md)) | Dev-only tools |

Don't split every component — HTTP request overhead.

---

## Suspense boundaries granularity

One Suspense per route — typical. Nested:

```tsx
<Suspense fallback={<PageSkeleton />}>
  <ProductsPage />
  {/* inside ProductsPage — a second Suspense for the lazy Chart */}
</Suspense>
```

The inner fallback — only the chart area; the page header stays visible.

---

## Relation to the performance lab

[23-lab-performance.md](23-lab-performance.md): products list virtual ([20-virtualization.md](20-virtualization.md)) + lazy routes → Lighthouse **FCP** improves on the login path.

---

## React 19 and lazy

React 19 keeps `lazy`/`Suspense`. `use()` for promises — see [22-suspense-data.md](22-suspense-data.md), not to be confused with route lazy.

---

## Common mistakes

**Lazy without Suspense.** React throws "component suspended" without a boundary.

**Suspense only in the child route, forgot it on the parent lazy.** A parent lazy needs its own Suspense.

**Forgot the default export.** `lazy()` resolves to undefined.

**Circular dynamic imports.** A lazy imports B lazy imports A — undefined at runtime.

**Preload every link on mount.** The network is flooded — only on intent.

**Split react-query into a lazy route.** QueryClientProvider must wrap the routes in main.

---

## Checklist

- [ ] Static vs dynamic import in Vite
- [ ] Why a skeleton fallback on a route
- [ ] The preload pattern with a shared import fn
- [ ] ChunkLoadError after a deploy
- [ ] What to keep in the main bundle

---

## Next

Next lesson: [22. Suspense for data: useSuspenseQuery](22-suspense-data.md).
