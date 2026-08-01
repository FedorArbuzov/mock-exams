# 22. Lab: contact form

## Scenario

Ticket **NEXT-222**: "A `/contact` page — an email + message form, saving on the server, success/error UX." Implement the Server Action from [21-server-actions.md](21-server-actions.md) with progressive enhancement and client feedback via `useActionState`.

**Time:** ~45–55 minutes.  
**Sandbox:** Next `:3000` (FastAPI not required — log on the server).

---

## Setup

```bash
cd courses/nextjs-basic/examples
npm run dev
```

The layout already has a "Contact" link → `/contact`.

Structure:

```text
app/contact/
  page.tsx
  actions.ts
  ContactForm.tsx    # client
lib/
  validation/
    contact.ts       # Zod schema
```

---

## Task 1. Zod schema

```tsx
// lib/validation/contact.ts
import { z } from "zod";

export const ContactSchema = z.object({
  email: z.string().email("Enter a valid email"),
  message: z
    .string()
    .min(10, "At least 10 characters")
    .max(2000, "Message is too long"),
});

export type ContactInput = z.infer<typeof ContactSchema>;
```

---

## Task 2. Server Action

```tsx
// app/contact/actions.ts
"use server";

import { ContactSchema } from "@/lib/validation/contact";

export type ContactState =
  | { ok: true; submittedAt: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> }
  | null;

export async function submitContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const raw = {
    email: formData.get("email"),
    message: formData.get("message"),
  };

  const parsed = ContactSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Check the form fields",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // Simulated persistence (replace with a fetch to FastAPI once the endpoint exists)
  await new Promise((r) => setTimeout(r, 400));
  console.info("[contact:submit]", {
    email: parsed.data.email,
    preview: parsed.data.message.slice(0, 40),
  });

  return { ok: true, submittedAt: new Date().toISOString() };
}
```

---

## Task 3. Client form

```tsx
// app/contact/ContactForm.tsx
"use client";

import { useActionState } from "react";
import { submitContact, type ContactState } from "./actions";

const initialState: ContactState = null;

export function ContactForm() {
  const [state, formAction, pending] = useActionState(
    submitContact,
    initialState,
  );

  if (state?.ok) {
    return (
      <div role="status" className="card">
        <h2>Thanks!</h2>
        <p className="muted">We'll reply on {state.submittedAt.slice(0, 10)}…</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="card" style={{ display: "grid", gap: "1rem" }}>
      <label>
        Email
        <input name="email" type="email" required autoComplete="email" />
        {state?.fieldErrors?.email?.map((m) => (
          <span key={m} className="error">{m}</span>
        ))}
      </label>

      <label>
        Message
        <textarea name="message" required rows={5} minLength={10} />
        {state?.fieldErrors?.message?.map((m) => (
          <span key={m} className="error">{m}</span>
        ))}
      </label>

      {state && !state.ok && state.error ? (
        <p role="alert" className="error">{state.error}</p>
      ) : null}

      <button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
```

---

## Task 4. Server page

```tsx
// app/contact/page.tsx
import type { Metadata } from "next";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <section>
      <h1>Feedback</h1>
      <p className="muted">
        The form works through a Server Action — try disabling JS and submitting again.
      </p>
      <ContactForm />
    </section>
  );
}
```

---

## Task 5. Checks

| Test | Expected |
|------|----------|
| Valid submit | success UI, log in the Next terminal |
| email `not-an-email` | Zod error |
| message `short` | min length error |
| JS disabled | form POST, redirect/render ok |
| Double click | `pending` disables the button |

DevTools → Network: on a client submit — a **`POST` to the current URL** (the Next Action protocol), not a separate `/api/contact`.

---

## Bonus: plain HTML fallback

Duplicate a minimal server-only form for comparison:

```tsx
// page.tsx fragment — optional
import { submitContact } from "./actions";

// <form action={submitContact}> without useActionState — server messages only via redirect?searchParams
```

Or use `redirect("/contact?sent=1")` after success in the action for a no-JS UX.

---

## Success criteria

- [ ] Zod validation on the server
- [ ] `useActionState` + pending
- [ ] Field-level errors
- [ ] Success state after submitting
- [ ] Log in the server console (not an alert with PII)
- [ ] (Bonus) success via query + no JS

---

## Common issues

| Symptom | Fix |
|---------|---------|
| Action not found | `"use server"` in actions.ts |
| Form doesn't submit | `name` on the inputs |
| Hydration mismatch | don't use `Date.now()` in a server page for the client |
| Infinite pending | the action must return state |

---

Next lesson: [23. Middleware: rewrite, redirect, headers](23-middleware.md).
