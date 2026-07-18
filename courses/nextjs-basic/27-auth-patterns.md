# 27. Auth-паттерны: JWT, session (обзор)

## Введение: сценарий с работы

Shop добавляет `/account/orders`. Junior кладёт JWT в `localStorage` и шлёт `Authorization: Bearer` из Client Component — security review: «XSS = полный захват аккаунта». Альтернатива — **httpOnly cookie** с access token, refresh через Route Handler, **middleware** режет `/account/*` без cookie. Полноценный Auth.js / Clerk — out of scope курса; здесь **архитектурный обзор** без vendor lock-in, с стендом FastAPI `:8090` как resource server.

Цель — понимать **где** проверять auth в Next.js App Router и **как** не слить токен в client bundle. Детали refresh rotation — [react-intermediate](../react-intermediate/README.md).

## Что вы узнаете

- Session vs JWT mental model
- httpOnly cookie flow для SPA/Next hybrid
- Middleware coarse guard
- Server Component / Action fine-grained check
- Route Handler login/logout/refresh
- Что **не** делать (localStorage JWT)
- Интеграция с FastAPI (Bearer vs cookie BFF)

---

## Модели аутентификации

| Модель | Где state | Плюсы | Минусы |
|--------|-----------|-------|--------|
| **Server session** | Redis/DB, cookie = session id | revoke instantly | state on server |
| **JWT access** | self-contained, cookie or header | stateless API | revoke сложнее |
| **OAuth social** | provider + your session | UX | complexity |

Next.js BFF часто: **JWT в httpOnly cookie**, FastAPI валидирует Bearer, который BFF добавляет server-side.

---

## Рекомендуемый flow (упрощённый)

```text
Browser                    Next.js BFF                 FastAPI :8090
   │                            │                            │
   │ POST /api/auth/login       │                            │
   │ email/password────────────►│ POST /auth/login──────────►│
   │                            │◄──── access + refresh ─────│
   │◄── Set-Cookie httpOnly ────│                            │
   │                            │                            │
   │ GET /account (cookie)      │                            │
   │───────────────────────────►│ middleware: cookie exists?   │
   │                            │ RSC: verify JWT / session    │
   │                            │ GET /me/orders + Bearer────►│
   │◄── HTML ───────────────────│                            │
```

---

## Login Route Handler

```tsx
// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ detail: "Invalid body" }, { status: 400 });
  }

  const upstream = await fetch(
    `${process.env.FASTAPI_URL}/api/v1/auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    },
  );

  if (!upstream.ok) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { access_token, expires_in } = await upstream.json();

  const res = NextResponse.json({ ok: true });
  res.cookies.set("access_token", access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: expires_in ?? 3600,
    path: "/",
  });

  return res;
}
```

На минимальном стенде курса auth endpoint может отсутствовать — используйте mock token для локальной практики.

---

## Logout

```tsx
// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("access_token", "", { maxAge: 0, path: "/" });
  return res;
}
```

Server Action альтернатива — `cookies().delete('access_token')`.

---

## Middleware guard

```tsx
// middleware.ts (фрагмент)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = ["/account", "/checkout"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PROTECTED.some((p) => pathname.startsWith(p))) {
    const token = request.cookies.get("access_token")?.value;
    if (!token) {
      const login = new URL("/login", request.url);
      login.searchParams.set("from", pathname);
      return NextResponse.redirect(login);
    }
    // опционально: lightweight JWT exp check без verify signature
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/checkout/:path*"],
};
```

Middleware — **не** замена verify signature; только «cookie есть и не явно expired».

---

## Fine-grained check в Server Component

```tsx
// app/account/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function getCurrentUser() {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) return null;

  const res = await fetch(`${process.env.FASTAPI_URL}/api/v1/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <h1>Привет, {user.email}</h1>;
}
```

**Defense in depth:** middleware + server verify.

---

## Server Action authorization

```tsx
"use server";

import { cookies } from "next/headers";

export async function cancelOrder(orderId: string) {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) throw new Error("Unauthorized");

  const res = await fetch(
    `${process.env.FASTAPI_URL}/api/v1/orders/${orderId}/cancel`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  if (!res.ok) throw new Error("Failed");
  revalidatePath("/account/orders");
}
```

Никогда не принимайте `userId` только из hidden form field — trust server session.

---

## Anti-patterns

| ❌ | Почему |
|----|--------|
| JWT в `localStorage` | XSS → steal |
| JWT в `NEXT_PUBLIC_*` | в client bundle |
| Auth только в client `useEffect` | flash + bypass |
| Trust client `isAdmin` flag | trivial forge |
| Long-lived access token без refresh | large theft window |

---

## Refresh token (overview)

- **Refresh** — httpOnly отдельная cookie, path `/api/auth/refresh` only.
- Access короткий (15 min), refresh длинный (7 d).
- Rotation: новый refresh при каждом use, detect reuse.

Route Handler `POST /api/auth/refresh` — server-only, вызывается из client через same-origin fetch или silent middleware (advanced).

---

## CSRF

Same-site cookies + `sameSite: lax` — baseline. Server Actions — built-in origin check. Для cookie-based API mutations — CSRF token или double-submit cookie pattern ([browser-platform](../javascript-path.md)).

---

## RBAC overview

```tsx
type Role = "user" | "admin";

function requireRole(user: { role: Role }, role: Role) {
  if (user.role !== role) redirect("/403");
}
```

Admin routes — отдельный matcher в middleware + server check role claim в JWT.

---

## Связь с FastAPI

FastAPI ожидает `Authorization: Bearer` ([fastapi](../../deploy/fastapi/README.md) JWT уроки в Python-треке). Next BFF:

1. Browser → cookie only.
2. Next server → Bearer to FastAPI.
3. FastAPI не exposed публично в prod (internal network).

---

## Типичные ошибки

1. **Verify JWT только в middleware** — без crypto verify на server page.

2. **Access token в URL query** — logs, referrer leak.

3. **Logout только client** — cookie остаётся.

4. **Static cache для /account** — cookies() делает dynamic — ok.

5. **Forward raw cookie to FastAPI** если API expects Bearer — format mismatch.

6. **Skip auth on Server Actions** — public POST vulnerability.

7. **Mock auth в production** — remove dev bypass.

8. **One year access token** — refresh pattern ignored.

---

## Чек-лист

- Где хранить access token для web app?
- Роль middleware vs RSC auth check?
- Как Next вызывает FastAPI от имени пользователя?
- Почему localStorage JWT плох?
- Где logout удаляет cookie?
- Что проверяет Server Action перед мутацией?
- Зачем refresh token отдельно от access?

Следующий урок: [28. Environment variables и конфиг](28-env-config.md).
