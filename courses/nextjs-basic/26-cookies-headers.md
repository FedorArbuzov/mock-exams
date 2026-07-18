# 26. Cookies, headers, `cookies()` / `headers()`

## Введение: сценарий с работы

Feature flag «Показать beta-каталог» хранится в cookie `features=beta`. Server Component должен прочитать flag **до render**, без мигания client-only. Locale из `Accept-Language` — в middleware вы уже ставите `x-locale` ([23-middleware.md](23-middleware.md)); в page нужно прочитать header. JWT session в **httpOnly** cookie — Server Action проверяет `cookies().get('session')`.

В App Router **`cookies()`** и **`headers()`** — async server APIs (Next.js 15). Их вызов делает route **dynamic** — opt-out из static cache ([16-caching-revalidate.md](16-caching-revalidate.md)). Это правильно для персонализированного контента.

## Что вы узнаете

- `import { cookies, headers } from 'next/headers'`
- Чтение и установка cookies (Server Actions, Route Handlers)
- `headers()` — request context на сервере
- Dynamic rendering при cookies/headers
- httpOnly, secure, sameSite
- Middleware cookies vs `cookies()` API
- Связь с auth ([27-auth-patterns.md](27-auth-patterns.md))

---

## `cookies()` — чтение

```tsx
// app/catalog/page.tsx
import { cookies } from "next/headers";

export default async function CatalogPage() {
  const cookieStore = await cookies();
  const beta = cookieStore.get("features")?.value === "beta";

  const items = await getItems();

  return (
    <section>
      <h1>{beta ? "Каталог (beta)" : "Каталог"}</h1>
      {/* ... */}
    </section>
  );
}
```

| Метод | Назначение |
|-------|------------|
| `get(name)` | одна cookie |
| `getAll()` | все |
| `has(name)` | boolean |
| `toString()` | Cookie header string |

**Next 15:** `await cookies()` — cookie store async.

---

## `cookies()` — запись

Запись — через **`set`** / **`delete`** в Server Action или Route Handler (не в plain Server Component render — side effects при render запрещены):

```tsx
"use server";

import { cookies } from "next/headers";

export async function enableBetaFeature() {
  const store = await cookies();
  store.set("features", "beta", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}
```

```tsx
export async function logout() {
  const store = await cookies();
  store.delete("session");
}
```

---

## `headers()` — чтение request

```tsx
import { headers } from "next/headers";

export default async function Page() {
  const h = await headers();
  const reqId = h.get("x-request-id");
  const ua = h.get("user-agent");
  const forwarded = h.get("x-forwarded-for");

  return (
    <p className="muted">
      Request ID: {reqId ?? "n/a"}
    </p>
  );
}
```

Read-only в Server Components. Middleware может **inject** headers через `NextResponse.next({ request: { headers } })`.

---

## Dynamic route guarantee

```tsx
import { cookies } from "next/headers";

export const dynamic = "force-dynamic"; // явно, если нужно

export default async function AccountPage() {
  const session = (await cookies()).get("session");
  if (!session) redirect("/login");
  // ...
}
```

Любой `cookies()` / `headers()` в дереве → Next помечает route dynamic при build.

---

## Cookie attributes

| Flag | Значение |
|------|----------|
| `httpOnly` | JS в браузере не читает — защита от XSS theft |
| `secure` | только HTTPS |
| `sameSite: 'lax' \| 'strict' \| 'none'` | CSRF / cross-site |
| `maxAge` / `expires` | TTL |
| `path` | scope URL |

Session JWT — **httpOnly** + **secure** в prod ([27-auth-patterns.md](27-auth-patterns.md)).

---

## Middleware vs `cookies()`

| | Middleware | `cookies()` in RSC |
|---|------------|---------------------|
| Когда | до route | при render / action |
| Use case | redirect guard | персонализация UI |
| API | `request.cookies` | `cookies()` |

Coarse auth redirect — middleware; чтение user id для «Привет, Anna» — RSC.

---

## Route Handler cookies

```tsx
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const store = await cookies();
  store.set("visited", "1");
  return NextResponse.json({ ok: true });
}
```

Или classic:

```tsx
import { NextResponse } from "next/server";

export async function GET() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("visited", "1", { path: "/" });
  return res;
}
```

---

## Client-side cookies (ограниченно)

httpOnly cookies **недоступны** в `document.cookie`. Client читает только non-httpOnly (theme, consent banner). Session — never on client.

```tsx
"use client";
// НЕ для session — только public prefs
document.cookie = "theme=dark; path=/; max-age=31536000; samesite=lax";
```

---

## Forwarding cookies к FastAPI

Server fetch **не** отправляет browser cookies автоматически:

```tsx
import { cookies, headers } from "next/headers";

export async function getPersonalizedItems() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;

  const res = await fetch(`${baseUrl()}/api/v1/me/items`, {
    headers: {
      Cookie: session ? `session=${session}` : "",
    },
    cache: "no-store",
  });
  // ...
}
```

BFF pattern: Next validates session, FastAPI trust internal network or service token.

---

## Privacy и logging

```tsx
const h = await headers();
console.log("req", h.get("x-request-id")); // OK
console.log("cookie", cookieStore.get("session")); // НЕ в prod logs
```

---

## Типичные ошибки

1. **`cookies().set` в Server Component render** — error; только Action/Handler.

2. **Забыть `await cookies()` в Next 15** — type/runtime issues.

3. **Ожидать static page с session** — dynamic only.

4. **Non-httpOnly session** — XSS → token theft.

5. **Huge cookie** — 4KB limit, лишние данные в JWT.

6. **Читать session на client** — security fail.

7. **Не forward только нужных cookies** к upstream.

8. **sameSite=none без secure** — browser reject.

---

## Чек-лист

- Где читать cookie в RSC?
- Где **записать** cookie?
- Почему route становится dynamic?
- Чем middleware cookies отличается от `cookies()`?
- Зачем httpOnly для session?
- Передаются ли cookies автоматически в server fetch?
- Как прочитать header из middleware в page?

Следующий урок: [27. Auth-паттерны: JWT, session (обзор)](27-auth-patterns.md).
