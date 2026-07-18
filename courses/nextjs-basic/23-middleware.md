# 23. Middleware: rewrite, redirect, headers

## Введение: сценарий с работы

Prod на `shop.example.com`, staging на `staging.shop.example.com`. Marketing просит редирект `/sale` → `/catalog?sale=1`. Security — заголовок `X-Frame-Options` на всех страницах. Auth — неавторизованных с `/account/*` отправить на `/login`. DevOps — A/B test: 10% трафика на `beta` deployment через rewrite.

Всё это **до** того, как запрос попадёт в `page.tsx`, делает **`middleware.ts`** в корне проекта (рядом с `app/`). Middleware — Edge Runtime по умолчанию: быстрый, но без полного Node API. Это аналог nginx `location` + `return 301` + `proxy_pass`, но в TypeScript рядом с приложением.

## Что вы узнаете

- Расположение и сигнатура `middleware.ts`
- `matcher` — на какие path применять
- `NextResponse.redirect`, `rewrite`, `next()`
- Чтение и изменение request/response headers
- Cookies в middleware (preview auth — глава 27)
- Ограничения Edge runtime
- Middleware vs Route Handlers vs Server Components

---

## Базовый файл

```tsx
// middleware.ts (корень examples/ или src/)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Исключить static files и _next:
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
```

Middleware выполняется **на каждый matching request** — держите его быстрым.

---

## `matcher`

```tsx
export const config = {
  matcher: ["/account/:path*", "/catalog/:path*"],
};
```

| Pattern | Совпадение |
|---------|------------|
| `/api/:path*` | все API |
| `/catalog/:path*` | catalog и вложенные |
| `/(en|ru)/:path*` | i18n prefix |

**Без matcher** — все routes (дорого). Исключайте `_next/static`, images, favicon.

---

## Redirect

```tsx
export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === "/sale") {
    const url = request.nextUrl.clone();
    url.pathname = "/catalog";
    url.searchParams.set("sale", "1");
    return NextResponse.redirect(url); // 307 temporary по умолчанию
  }

  if (pathname === "/old-catalog") {
    return NextResponse.redirect(new URL("/catalog", request.url), 301);
  }

  return NextResponse.next();
}
```

| Код | Когда |
|-----|-------|
| 307/308 | временный (сохраняет method) |
| 301/302 | постоянный / legacy |

---

## Rewrite (прозрачный proxy)

URL в браузере **не меняется**, внутренний route другой:

```tsx
if (pathname.startsWith("/docs")) {
  return NextResponse.rewrite(new URL("/help" + pathname.slice(5), request.url));
}
```

A/B на другой internal path:

```tsx
const bucket = request.cookies.get("ab")?.value;
if (bucket === "beta" && pathname === "/") {
  return NextResponse.rewrite(new URL("/beta-home", request.url));
}
```

Rewrite ≠ redirect: пользователь не видит смену URL.

---

## Request headers → downstream

```tsx
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  requestHeaders.set("x-request-id", crypto.randomUUID());

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}
```

В Server Component:

```tsx
import { headers } from "next/headers";

export default async function Page() {
  const h = await headers();
  const reqId = h.get("x-request-id");
  // ...
}
```

Подробнее — [26-cookies-headers.md](26-cookies-headers.md).

---

## Response headers (security)

```tsx
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}
```

Единое место для headers на все HTML/API responses matching matcher.

---

## Auth guard (обзор)

```tsx
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/account")) {
    const token = request.cookies.get("session")?.value;
    if (!token) {
      const login = new URL("/login", request.url);
      login.searchParams.set("from", pathname);
      return NextResponse.redirect(login);
    }
  }

  return NextResponse.next();
}
```

Полный JWT flow — [27-auth-patterns.md](27-auth-patterns.md). Middleware проверяет **наличие** cookie, не тяжёлую DB-логику.

---

## Middleware vs другие слои

| Слой | Когда выполняется | Задачи |
|------|-------------------|--------|
| **Middleware** | до routing, edge | redirect, rewrite, coarse auth, headers |
| **Route Handler** | `/api/*` | REST, webhooks |
| **Server Component** | render | data fetch, fine-grained auth |
| **Server Action** | POST form | mutations |

**Не** делайте fetch к FastAPI в middleware на каждый asset — только на protected HTML routes.

---

## Edge limitations

- Нет native Node modules (`fs`, `crypto` partial — Web Crypto ok).
- `fetch` к FastAPI — ok, но добавляет latency на **каждый** matched request.
- Env: только `NEXT_PUBLIC_*` и специальные edge env на platform.

```tsx
export const runtime = "experimental-edge"; // legacy naming; middleware always edge-like
```

---

## Matcher + API routes

```tsx
export const config = {
  matcher: ["/api/proxy/:path*", "/account/:path*"],
};
```

Для BFF ([20-lab-route-handlers.md](20-lab-route-handlers.md)) можно добавить rate-limit header или API key check в middleware.

---

## Logging и debugging

```tsx
console.log("[mw]", request.method, request.nextUrl.pathname);
```

Логи middleware — в terminal `next dev` или edge logs на Vercel. Используйте `x-request-id` для трассировки с FastAPI.

---

## Типичные ошибки

1. **Тяжёлая логика в middleware** — TTFB на все routes.

2. **Matcher слишком широкий** — middleware на каждый `.png`.

3. **Infinite redirect** — `/login` тоже редиректит на `/login`.

4. **Rewrite loop** — rewrite на тот же path.

5. **Читать body request** — middleware не для больших body; только headers/cookies/url.

6. **Полагаться только на middleware auth** — всегда проверяйте на server action/page.

7. **Забыть `return NextResponse.next()`** — зависший request.

8. **fs/path в middleware** — crash на edge.

---

## Чек-лист

- Где лежит `middleware.ts` относительно `app/`?
- Redirect vs rewrite — что видит пользователь в URL?
- Зачем `matcher`?
- Как передать header в Server Component?
- Почему не fetch FastAPI в middleware на `/_next/static`?
- Где coarse vs fine-grained auth?
- Какой runtime у middleware?

Следующий урок: [24. TanStack Query в Next.js](24-tanstack-query.md).
