# 05. Dynamic routes: `[id]`, catch-all, optional catch-all

## Введение: сценарий с работы

Пятница, prod. Marketing расшares ссылку `/catalog/sneaker-x-pro` — **404**. Оказалось, в SPA был один компонент `ProductDetail` с `useParams().id`. В Next junior создал `app/catalog/product/page.tsx` — URL жёстко `/catalog/product`, не `/catalog/42`.

Tech lead: «Dynamic segment — **папка в квадратных скобках** `[id]`, params приходят в page props». Ещё кейс: CMS отдаёт `/docs/getting-started/install` — нужен **catch-all** `[...slug]`. И `/settings` **и** `/settings/profile` — **optional catch-all** `[[...slug]]`.

После этой главы вы построите `/catalog/[id]` в [07-lab-routing.md](07-lab-routing.md) и подключите fetch товара с FastAPI `:8090` в главе 14.

## Что вы узнаете

- **Dynamic segment** `[param]` и typed `params` в Next.js 15.
- **Catch-all** `[...slug]` для произвольной глубины path.
- **Optional catch-all** `[[...slug]]` — zero или больше segments.
- `generateStaticParams` (preview SSG для N товаров).
- Отличие от React Router `:id` и типичные ошибки params.

## Dynamic segment `[id]`

```text
app/catalog/[id]/page.tsx  →  /catalog/1, /catalog/sneaker-x, /catalog/anything
```

```tsx
// app/catalog/[id]/page.tsx
type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <section>
      <h1>Товар: {id}</h1>
      <p className="muted">
        Placeholder. В уроке 15 загрузим GET /api/v1/items/{id} с :8090.
      </p>
    </section>
  );
}
```

**Next.js 15:** `params` (и `searchParams`) — **Promise**; нужен `await params`. Это breaking change от 14 — на собесах спрашивают.

Сравнение react-basic:

```tsx
// React Router
const { id } = useParams();
```

```tsx
// App Router — server page
const { id } = await params;
```

## Имена параметров

Папка `[id]` → ключ `id`. `[productId]` → `productId`. Имя папки = имя prop в `params`.

| Файловая папка | URL | params |
|----------------|-----|--------|
| `[id]` | `/catalog/42` | `{ id: "42" }` |
| `[category]/[id]` | `/catalog/shoes/42` | `{ category: "shoes", id: "42" }` |

## Catch-all: `[...slug]`

Один segment, **массив** path parts:

```text
app/docs/[...slug]/page.tsx
```

| URL | params.slug |
|-----|-------------|
| `/docs/a` | `["a"]` |
| `/docs/a/b/c` | `["a", "b", "c"]` |
| `/docs` | **404** — нужен минимум один segment |

```tsx
type PageProps = {
  params: Promise<{ slug: string[] }>;
};

export default async function DocsPage({ params }: PageProps) {
  const { slug } = await params;
  const path = slug.join("/");

  return (
    <article>
      <h1>Docs: {path}</h1>
    </article>
  );
}
```

Use case: CMS markdown paths, nested help center без отдельного файла на каждый уровень.

## Optional catch-all: `[[...slug]]`

```text
app/settings/[[...slug]]/page.tsx
```

| URL | params.slug |
|-----|-------------|
| `/settings` | `undefined` или обработайте как `[]` |
| `/settings/profile` | `["profile"]` |
| `/settings/profile/email` | `["profile", "email"]` |

```tsx
export default async function SettingsPage({ params }: PageProps) {
  const { slug } = await params;
  const parts = slug ?? [];

  if (parts.length === 0) {
    return <p>Общие настройки shop</p>;
  }

  return <p>Раздел: {parts.join(" / ")}</p>;
}
```

Один `page.tsx` покрывает index + вложенность — удобно для tab-like settings UI.

## Сравнение трёх форм

| Синтаксис | `/base` | `/base/x` | `/base/x/y` |
|-----------|---------|-----------|-------------|
| `[id]` | 404 | match | 404 (один segment) |
| `[...slug]` | 404 | match | match |
| `[[...slug]]` | match | match | match |

## generateStaticParams (SSG preview)

Для ISR/SSG списка товаров Next может **prebuild** известные ids:

```tsx
export async function generateStaticParams() {
  const res = await fetch("http://localhost:8090/api/v1/items?limit=100");
  const items: { id: string }[] = await res.json();

  return items.map((item) => ({ id: item.id }));
}
```

Build создаст HTML для каждого `id`; неизвестный id — on-demand SSR (зависит от `dynamicParams`, default `true`). Детали кэша — [16-caching-revalidate.md](16-caching-revalidate.md).

## searchParams vs params

```tsx
// /catalog?sort=price&page=2
type PageProps = {
  searchParams: Promise<{ sort?: string; page?: string }>;
};

export default async function CatalogPage({ searchParams }: PageProps) {
  const { sort, page } = await searchParams;
  // filter на сервере
}
```

`params` — **path**; `searchParams` — **query string**. Оба Promise в Next 15.

## notFound() для несуществующего товара

```tsx
import { notFound } from "next/navigation";

const res = await fetch(`http://localhost:8090/api/v1/items/${id}`);
if (res.status === 404) notFound();
```

Рендерит `not-found.tsx` ([18-error-not-found.md](18-error-not-found.md)).

## FastAPI :8090 и id

REST API обычно:

```text
GET /api/v1/items       → список
GET /api/v1/items/{id}  → один товар
```

Dynamic `[id]` в Next **зеркалит** последний segment API path — не обязан совпадать тип (string в URL всегда string; парсите `Number(id)` осторожно).

## Типичные ошибки

**Забыть `await params` в Next 15.** Runtime warning / пустой id.

**`[id].tsx` файл вместо папки `[id]/page.tsx`.** Dynamic — **папка** со скобками.

**Catch-all на `/docs` без optional.** Нужен `[[...slug]]`.

**Путать `slug` string vs string[].** Catch-all всегда **массив**.

**Хардкод `product` в path вместо `[id]`.** SEO-URL требуют dynamic segment.

**Передать число в URL без валидации.** `NaN` в UI — валидируйте Zod ([typescript-basic](../typescript-basic/README.md)).

## Чек-лист

- [ ] Создаёте `app/catalog/[id]/page.tsx` с `await params`
- [ ] Объясняете разницу `[...slug]` и `[[...slug]]`
- [ ] Знаете, что params/path — Promise в Next 15
- [ ] Можете связать `[id]` с GET item на :8090
- [ ] Помните про `notFound()` для 404 товара

Следующий урок: [06. Layouts, templates, loading UI](06-layouts-templates.md).
