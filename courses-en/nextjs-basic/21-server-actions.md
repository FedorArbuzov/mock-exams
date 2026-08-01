# 21. Server Actions: forms without a separate API

## Intro: a scenario from work

A "Contact us" form on `/contact`: the product team wants it **to work without JavaScript** (accessibility, SEO), while the backend requires a POST with validation. A developer writes a Route Handler + `fetch` from a client form — 80 lines of boilerplate, duplicated Zod, CSRF concerns. The Next.js 14+ alternative is **Server Actions**: async functions on the server, called directly from `<form action={...}>`.

A Server Action isn't a replacement for FastAPI across the whole API, but it's the **ideal tool for UI mutations**: feedback, subscribe, "add to favorites" with `revalidatePath`. The lab [22-lab-server-actions.md](22-lab-server-actions.md) builds the contact form.

## What you'll learn

- `"use server"` — file vs inline
- `<form action={submit}>` without client JS
- `FormData`, validation, field errors
- `revalidatePath` / `revalidateTag` after a mutation
- `redirect()` after success
- `useFormStatus`, `useActionState` (client helpers)
- Server Actions vs Route Handlers

---

## A minimal Server Action

```tsx
// app/contact/actions.ts
"use server";

import { revalidatePath } from "next/cache";

export async function submitContact(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!email.includes("@")) {
    return { ok: false as const, error: "Invalid email" };
  }
  if (message.length < 10) {
    return { ok: false as const, error: "Message is too short" };
  }

  // Simulated save (the FastAPI contact endpoint may not exist)
  console.info("[contact]", { email, messageLength: message.length });

  revalidatePath("/contact");
  return { ok: true as const };
}
```

```tsx
// app/contact/page.tsx
import { submitContact } from "./actions";

export default function ContactPage() {
  return (
    <section>
      <h1>Contact</h1>
      <form action={submitContact}>
        <label>
          Email
          <input name="email" type="email" required />
        </label>
        <label>
          Message
          <textarea name="message" required minLength={10} />
        </label>
        <button type="submit">Send</button>
      </form>
    </section>
  );
}
```

The form works **without hydration** — the browser does a POST, and Next calls the action on the server.

---

## `"use server"` — two styles

| Style | Where | When |
|-------|-----|-------|
| **File-level** | as the first line of `actions.ts` | several actions in one file |
| **Inline** | inside a Server Component before `async function` | a single action next to the UI |

Inline:

```tsx
export default function Page() {
  async function createItem(formData: FormData) {
    "use server";
    // ...
  }
  return <form action={createItem}>...</form>;
}
```

A file with `"use server"` is **not imported** into a Client Component — only action references are passed through props (serializable).

---

## Progressive enhancement + client UI

For error messages without a full page reload — a client wrapper:

```tsx
// app/contact/ContactForm.tsx
"use client";

import { useActionState } from "react";
import { submitContact } from "./actions";

export function ContactForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => submitContact(formData),
    null,
  );

  return (
    <form action={formAction}>
      {/* fields */}
      {state && !state.ok ? (
        <p role="alert" className="error">{state.error}</p>
      ) : null}
      {state?.ok ? <p role="status">Thanks! We'll reply by email.</p> : null}
      <button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
```

`useActionState` (React 19) — pending state + the action result. Without JS, the plain form still works via `action={submitContact}` on the server page.

---

## `revalidatePath` after a mutation

After data changes on the backend, the RSC cache goes stale ([16-caching-revalidate.md](16-caching-revalidate.md)):

```tsx
"use server";

import { revalidatePath, revalidateTag } from "next/cache";

export async function refreshCatalog() {
  revalidateTag("catalog-items");
  revalidatePath("/catalog");
}
```

Call it **after a successful** mutation — not before validation.

---

## `redirect()`

```tsx
"use server";

import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const ok = await verifyCredentials(formData);
  if (!ok) return { error: "Wrong password" };
  redirect("/account");
}
```

`redirect` throws a special error — don't wrap it in try/catch without rethrowing.

---

## Validation with Zod

```tsx
"use server";

import { z } from "zod";

const Schema = z.object({
  email: z.string().email(),
  message: z.string().min(10).max(2000),
});

export async function submitContact(formData: FormData) {
  const parsed = Schema.safeParse({
    email: formData.get("email"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // ...
  return { ok: true as const };
}
```

---

## Forwarding to FastAPI from an Action

```tsx
"use server";

export async function submitContact(formData: FormData) {
  const payload = {
    email: String(formData.get("email")),
    message: String(formData.get("message")),
  };

  const res = await fetch(`${process.env.FASTAPI_URL}/api/v1/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return { ok: false as const, error: "Service temporarily unavailable" };
  }

  return { ok: true as const };
}
```

On the course sandbox the contact endpoint may not exist — the lab uses a server-side log.

---

## Security

| Topic | Recommendation |
|------|--------------|
| CSRF | Next Actions have a built-in origin check (same-site POST) |
| Auth | check the session in the action ([27-auth-patterns.md](27-auth-patterns.md)) |
| Rate limit | middleware or an in-action counter |
| Secrets | server env only |
| Idempotency | protection against double-submit (UI disabled + server idempotency key) |

---

## Server Actions vs Route Handlers

| Criterion | Server Action | Route Handler |
|----------|---------------|---------------|
| Progressive form | ✅ | possible, but awkward |
| REST for mobile | ❌ | ✅ |
| Webhook from Stripe | ❌ | ✅ |
| `revalidatePath` | ✅ natural | ✅ manual |
| CDN cache GET | N/A | configurable |

---

## Limitations

- Actions are **POST** under the hood; not for GET-reads (use RSC fetch).
- Don't call an action from an arbitrary client callback without form/`startTransition` patterns — use the documented APIs.
- Large files — `FormData` + storage (S3); body size limits depend on the platform.

---

## Common mistakes

1. **`"use server"` in a Client Component file** — build error.

2. **Importing server action logic into the client** — only import the action function reference.

3. **Forgetting `revalidatePath`** — the UI shows a stale catalog after an admin edit.

4. **Returning something non-serializable** (Date, Map, class instance) — serialization error.

5. **try/catch swallows the redirect** — rethrow NEXT_REDIRECT.

6. **Duplicating validation only on the client** — the server must validate.

7. **An Action for read-only** — anti-pattern; an unnecessary POST.

8. **Not handling pending** — double submit.

---

## Checklist

- Does the form action work without JavaScript?
- Where do you declare `"use server"` — file vs inline?
- Why call `revalidatePath` after a successful submit?
- How does an Action differ from a Route Handler POST?
- How do you return a field error without throwing?
- Can you call FastAPI with a secret from an Action?
- What does `redirect()` do inside an action?

Next lesson: [22. Lab: contact form](22-lab-server-actions.md).
