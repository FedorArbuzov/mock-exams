# 08. Навигация: `Link`, `useRouter`, soft navigation

## Введение: сценарий с работы

QA баг: «При клике по каталогу **мигает весь экран**, пропадает scroll, медленно». Причина — разработчик заменил `<Link>` на `<a href="/catalog">` «для простоты». Full page reload: заново CSS, JS, RSC payload с нуля.

В react-basic React Router делал **client-side navigation** через History API. Next **`<Link>`** из `next/link` — тот же принцип плюс prefetch RSC для видимых ссылок. Программный переход — `useRouter()` из **`next/navigation`** (не `next/router` — это Pages Router legacy).

После [07-lab-routing.md](07-lab-routing.md) у вас список товаров с `<Link>`. Эта глава — правила навигации, prefetch, `replace`, `back`, и когда нужен hard reload.

## Что вы узнаете

- Компонент **`<Link>`** vs `<a>`.
- **`useRouter`** из `next/navigation`: `push`, `replace`, `refresh`, `back`.
- **Soft navigation** — без full reload, сохранение layouts.
- **Prefetch** — как Next подгружает маршруты.
- **`redirect()`** на сервере (preview).
- Отличие от React Router `useNavigate`.

## Link — declarative navigation

```tsx
import Link from "next/link";

<Link href="/catalog">Каталог</Link>
<Link href="/catalog/sku-001">Кроссовки</Link>
```

Рендерит `<a>` с правильным href (SEO, open in new tab), но перехватывает click для **client transition**.

| | `<a href>` | `<Link href>` |
|---|------------|---------------|
| Full reload | да | **нет** (same-origin) |
| Layout persist | нет | **да** |
| Prefetch | нет | да (default) |
| SEO crawl | да | да |

Стартовый [`layout.tsx`](examples/app/layout.tsx) уже использует `<Link>` для nav.

### Link props (частые)

```tsx
<Link href="/catalog" prefetch={false}>
  Каталог без prefetch
</Link>

<Link href="/catalog" replace>
  Заменить history entry (не push)
</Link>

<Link href="/catalog" scroll={false}>
  Не скроллить в top после перехода
</Link>
```

`className`, `children` — как у обычного anchor wrapper.

## useRouter — imperative navigation

Только в **Client Component**:

```tsx
"use client";

import { useRouter } from "next/navigation";

export function GoToCartButton() {
  const router = useRouter();

  return (
    <button type="button" onClick={() => router.push("/cart")}>
      В корзину
    </button>
  );
}
```

| Метод | Действие |
|-------|----------|
| `router.push(href)` | navigate, добавить history |
| `router.replace(href)` | navigate без новой history entry |
| `router.back()` | history back |
| `router.forward()` | history forward |
| `router.refresh()` | re-fetch server data **текущего** route |
| `router.prefetch(href)` | ручной prefetch |

**Не путать:** `next/router` (Pages) vs **`next/navigation`** (App Router).

Сравнение react-basic:

```tsx
const navigate = useNavigate();
navigate("/catalog");
```

```tsx
const router = useRouter();
router.push("/catalog");
```

## Soft navigation under the hood (упрощённо)

```text
Click <Link /catalog/42>
    │
    ▼
Next client router
    │
    ├─ fetch RSC payload for /catalog/42 (Flight)
    ├─ update browser URL (pushState)
    ├─ reconcile React tree — swap page segment
    └─ layouts выше page — REUSE (не remount)
```

Пользователь не видит белый document flash; header из root layout остаётся.

## Prefetch

По умолчанию Next **prefetch** `<Link>` в viewport (production + dev с нюансами):

- подгружает JS и RSC для target route;
- переход feels instant.

Много ссылок (1000 SKU) — consider `prefetch={false}` на списках или pagination.

## redirect() на сервере

```tsx
import { redirect } from "next/navigation";

export default async function LegacyProductPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/catalog/${id}`);
}
```

HTTP 307 — **не** client hook. Use case: canonical URLs, auth guard (глава 27).

## usePathname и useSearchParams

```tsx
"use client";

import { usePathname, useSearchParams } from "next/navigation";

export function ActiveNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link href={href} className={active ? "active" : undefined}>
      {children}
    </Link>
  );
}
```

`useSearchParams()` — query string на клиенте; на сервере — `searchParams` prop page ([05-dynamic-routes.md](05-dynamic-routes.md)).

## External links и API

```tsx
<Link href="https://docs.mock-exams.local">Docs</Link>
<a href="http://localhost:8090/docs" target="_blank" rel="noopener noreferrer">
  OpenAPI FastAPI
</a>
```

External — обычный `<a>`. FastAPI `:8090` — другой origin, не `<Link>` для API calls.

## Navigation после mutation (preview)

После Server Action формы часто:

```tsx
router.refresh(); // обновить server components на текущей странице
router.push("/thank-you");
```

Глава 21 — Server Actions.

## scrollRestoration

Next по умолчанию scroll to top on navigation. Для длинного каталога:

```tsx
<Link href={`/catalog/${id}`} scroll={false}>
```

Или manual scroll restore — advanced.

## Типичные ошибки

**`<a href="/catalog">` для internal routes.** Full reload — теряете RSC benefits.

**`useRouter` из `next/router`.** App Router → **`next/navigation`**.

**`useRouter` в Server Component.** Hooks только client — вынесите кнопку в `"use client"`.

**Ждать `router.push` async URL update в том же tick для server state.** Для fresh data — `router.refresh()`.

**Link на dynamic без string template.** `href={"/catalog/" + id}` — ok; объект `{ pathname, query }` — Pages style, в App — string.

**Prefetch на admin с sensitive data.** Отключите prefetch для auth routes.

## Чек-лист

- [ ] Internal links — `<Link>`, external — `<a>`
- [ ] `useRouter` только из `next/navigation` в client
- [ ] Объясняете soft navigation vs full reload
- [ ] Знаете `router.refresh()` после изменений на сервере
- [ ] Active nav через `usePathname`

Следующий урок: [09. React Server Components: зачем и как](09-server-components.md).
