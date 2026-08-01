# 26. Cookies, headers, `cookies()` / `headers()`

## Intro: a scenario from work

The "Show the beta catalog" feature flag is stored in the `features=beta` cookie. A Server Component must read the flag **before render**, without a client-only flash. The locale from `Accept-Language` — you already set `x-locale` in middleware ([23-middleware.md](23-middleware.md)); in the page you need to read the header. The JWT session in an **httpOnly** cookie — a Server Action checks `cookies().get('session')`.

In the App Router, **`cookies()`** and **`headers()`** are async server APIs (Next.js 15). Calling them makes the route **dynamic** — an opt-out from the static cache ([16-caching-revalidate.md](16-caching-revalidate.md)). That's correct for personalized content.

## What you'll learn

- `import { cookies, headers } from 'next/headers'`
- Reading and setting cookies (Server Actions, Route Handlers)
- `headers()` — request context on the server
- Dynamic rendering with cookies/headers
- httpOnly, secure, sameSite
- Middleware cookies vs the `cookies()` API
- The relation to auth ([27-auth-patterns.md](27-auth-patterns.md))

---

## `cookies()` — reading

```tsx
// app/catalog/page.tsx
import { cookies } from "next/headers";

export default async function CatalogPage() {
  const cookieStore = await cookies();
  const beta = cookieStore.get("features")?.value === "beta";

  const items = await getItems();

  return (
    <section>
      <h1>{beta ? "Catalog (beta)" : "Catalog"}</h1>
      {/* ... */}
    </section>
  );
}
```

| Method | Purpose |
|-------|------------|
| `get(name)` | one cookie |
| `getAll()` | all |
| `has(name)` | boolean |
| `toString()` | Cookie header string |

**Next 15:** `await cookies()` — the cookie store is async.

---

## `cookies()` — writing

Writing — via **`set`** / **`delete`** in a Server Action or Route Handler (not in a plain Server Component render — side effects during render are forbidden):

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

## `headers()` — reading the request

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

Read-only in Server Components. Middleware can **inject** headers via `NextResponse.next({ request: { headers } })`.

---

## Dynamic route guarantee

```tsx
import { cookies } from "next/headers";

export const dynamic = "force-dynamic"; // explicitly, if needed

export default async function AccountPage() {
  const session = (await cookies()).get("session");
  if (!session) redirect("/login");
  // ...
}
```

Any `cookies()` / `headers()` in the tree → Next marks the route dynamic at build.

---

## Cookie attributes

| Flag | Meaning |
|------|----------|
| `httpOnly` | JS in the browser can't read it — protection against XSS theft |
| `secure` | HTTPS only |
| `sameSite: 'lax' \| 'strict' \| 'none'` | CSRF / cross-site |
| `maxAge` / `expires` | TTL |
| `path` | URL scope |

Session JWT — **httpOnly** + **secure** in prod ([27-auth-patterns.md](27-auth-patterns.md)).

---

## Middleware vs `cookies()`

| | Middleware | `cookies()` in RSC |
|---|------------|---------------------|
| When | before the route | during render / action |
| Use case | redirect guard | UI personalization |
| API | `request.cookies` | `cookies()` |

Coarse auth redirect — middleware; reading the user id for "Hi, Anna" — RSC.

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

Or the classic way:

```tsx
import { NextResponse } from "next/server";

export async function GET() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("visited", "1", { path: "/" });
  return res;
}
```

---

## Client-side cookies (limited)

httpOnly cookies are **inaccessible** in `document.cookie`. The client can only read non-httpOnly ones (theme, consent banner). Session — never on the client.

```tsx
"use client";
// NOT for the session — only public prefs
document.cookie = "theme=dark; path=/; max-age=31536000; samesite=lax";
```

---

## Forwarding cookies to FastAPI

A server fetch does **not** send browser cookies automatically:

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

BFF pattern: Next validates the session, FastAPI trusts the internal network or a service token.

---

## Privacy and logging

```tsx
const h = await headers();
console.log("req", h.get("x-request-id")); // OK
console.log("cookie", cookieStore.get("session")); // NOT in prod logs
```

---

## Common mistakes

1. **`cookies().set` in a Server Component render** — error; Action/Handler only.

2. **Forgetting `await cookies()` in Next 15** — type/runtime issues.

3. **Expecting a static page with a session** — dynamic only.

4. **A non-httpOnly session** — XSS → token theft.

5. **A huge cookie** — 4KB limit, extra data in the JWT.

6. **Reading the session on the client** — security fail.

7. **Not forwarding only the needed cookies** to the upstream.

8. **sameSite=none without secure** — the browser rejects it.

---

## Checklist

- Where do you read a cookie in RSC?
- Where do you **write** a cookie?
- Why does the route become dynamic?
- How do middleware cookies differ from `cookies()`?
- Why httpOnly for the session?
- Are cookies passed automatically in a server fetch?
- How do you read a header from middleware in a page?

Next lesson: [27. Auth patterns: JWT, session (overview)](27-auth-patterns.md).
