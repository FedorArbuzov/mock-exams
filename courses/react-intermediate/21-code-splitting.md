# 21. Code splitting: `lazy`, `Suspense`, preload

## Сценарий с работы

Lighthouse на admin SPA: **Initial JS 890 KB** — пользователь на `/login` скачивает chunk с product editor, charts и CRUD forms. Product owner: «Разделите bundles по routes; settings открывают 5% users». Vite + React Router ([react-basic: nested routes](../react-basic/24-nested-routes.md)) + `React.lazy` — стандартный паттерн перед [22-suspense-data.md](22-suspense-data.md) и лабой [23-lab-performance.md](23-lab-performance.md).

Auth flow ([13-lab-auth.md](13-lab-auth.md)) должен оставаться в main chunk — быстрый login.

## Что вы узнаете

- Static vs dynamic import
- `React.lazy` + `Suspense` fallback
- Route-based splitting с React Router 7
- Preload on hover / on intent
- Vite chunk names и анализ bundle
- Error handling для failed chunk load

---

## Как Vite делает chunks

```tsx
import { ProductEditorPage } from "./features/products/ProductEditorPage";
```

Static import — код в main или shared chunk.

```tsx
const ProductEditorPage = lazy(
  () => import("./features/products/ProductEditorPage"),
);
```

Dynamic `import()` — отдельный async chunk, загружается при первом render `ProductEditorPage`.

Проверка: `npm run build` → `dist/assets/ProductEditorPage-xxx.js`.

---

## React.lazy basics

```tsx
import { lazy, Suspense } from "react";

const SettingsPage = lazy(() => import("@/features/settings/SettingsPage"));

export function SettingsRoute() {
  return (
    <Suspense fallback={<PageSkeleton title="Настройки" />}>
      <SettingsPage />
    </Suspense>
  );
}
```

Пока chunk грузится — `fallback`. После — реальный компонент.

**lazy** только для default export:

```tsx
// ProductEditorPage.tsx
export default function ProductEditorPage() { ... }

// или
export function ProductEditorPage() { ... }
export default ProductEditorPage;
```

Named export без default:

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

Login route — **без** lazy, в main bundle.

---

## Skeleton fallback

Согласуйте с [react-basic: UI states](../react-basic/31-ui-states.md):

```tsx
export function PageSkeleton({ title }: { title?: string }) {
  return (
    <div className="page-skeleton" aria-busy="true" aria-label={title ?? "Загрузка"}>
      <div className="skeleton skeleton--title" />
      <div className="skeleton skeleton--block" />
    </div>
  );
}
```

Не используйте `fallback={null}` на route — layout «прыгает». Error boundary ([14-error-boundaries.md](14-error-boundaries.md)) **не** ловит suspend — только Suspense fallback.

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
        productDetailImport(); // начинает fetch chunk
      }}
    >
      {title}
    </Link>
  );
}
```

Router 7 `lazy` route property (data router API) — альтернатива; для component lazy достаточно duplicate import fn.

**Mobile:** `onTouchStart` prefetch осторожно — лишний трафик.

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

Vite использует `/* @vite-ignore */` реже; magic comment `webpackChunkName` частично поддерживается. Явный path folder = имя chunk в dist.

Анализ:

```bash
npm run build
npx vite-bundle-visualizer  # если добавите plugin — опционально
```

---

## Failed chunk load (deploy mismatch)

После deploy старый tab ссылается на удалённый chunk → `ChunkLoadError`. UX:

```tsx
class LazyErrorBoundary extends Component {
  // или react-error-boundary
  componentDidCatch(error: Error) {
    if (error.name === "ChunkLoadError") {
      window.location.reload();
    }
  }
}
```

Toast из [16-global-error-ux.md](16-global-error-ux.md): «Доступна новая версия — обновите страницу».

---

## Что не lazy-load

| Keep in main | Lazy candidate |
|--------------|----------------|
| Login, AuthProvider shell | Product editor |
| Router shell, QueryClient | Settings, reports |
| Shared Button, ErrorPanel | Heavy chart lib |
| MSW bootstrap ([24-msw-intro.md](24-msw-intro.md)) | Dev-only tools |

Не split каждый компонент — overhead HTTP requests.

---

## Suspense boundaries granularity

Один Suspense на route — типично. Nested:

```tsx
<Suspense fallback={<PageSkeleton />}>
  <ProductsPage />
  {/* внутри ProductsPage — второй Suspense для lazy Chart */}
</Suspense>
```

Внутренний fallback — только chart area; page header виден.

---

## Связь с performance lab

[23-lab-performance.md](23-lab-performance.md): products list virtual ([20-virtualization.md](20-virtualization.md)) + lazy routes → Lighthouse **FCP** улучшается на login path.

---

## React 19 и lazy

React 19 сохраняет `lazy`/`Suspense`. `use()` для promises — см. [22-suspense-data.md](22-suspense-data.md), не путать с route lazy.

---

## Типичные ошибки

**Lazy без Suspense.** React throw «component suspended» без boundary.

**Suspense только в child route, forgot on parent lazy.** Parent lazy needs own Suspense.

**Default export забыли.** `lazy()` resolve undefined.

**Circular dynamic imports.** A lazy imports B lazy imports A — runtime undefined.

**Preload every link on mount.** Сеть забита — только intent.

**Split react-query to lazy route.** QueryClientProvider must wrap routes in main.

---

## Чек-лист

- [ ] Static vs dynamic import в Vite
- [ ] Зачем skeleton fallback на route
- [ ] Preload pattern с shared import fn
- [ ] ChunkLoadError после deploy
- [ ] Что оставить в main bundle

---

## Далее

Следующий урок: [22. Suspense для данных: useSuspenseQuery](22-suspense-data.md).
