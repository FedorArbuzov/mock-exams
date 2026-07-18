# 22. Лаба: форма обратной связи

## Сценарий

Тикет **NEXT-222**: «Страница `/contact` — форма email + сообщение, сохранение на сервере, UX success/error». Реализуйте Server Action из [21-server-actions.md](21-server-actions.md) с progressive enhancement и client feedback через `useActionState`.

**Время:** ~45–55 минут.  
**Стенд:** Next `:3000` (FastAPI не обязателен — log на server).

---

## Подготовка

```bash
cd courses/nextjs-basic/examples
npm run dev
```

В layout уже есть ссылка «Контакты» → `/contact`.

Структура:

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

## Задание 1. Zod-схема

```tsx
// lib/validation/contact.ts
import { z } from "zod";

export const ContactSchema = z.object({
  email: z.string().email("Введите корректный email"),
  message: z
    .string()
    .min(10, "Минимум 10 символов")
    .max(2000, "Слишком длинное сообщение"),
});

export type ContactInput = z.infer<typeof ContactSchema>;
```

---

## Задание 2. Server Action

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
      error: "Проверьте поля формы",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // Имитация персистенции (замените на fetch к FastAPI при появлении endpoint)
  await new Promise((r) => setTimeout(r, 400));
  console.info("[contact:submit]", {
    email: parsed.data.email,
    preview: parsed.data.message.slice(0, 40),
  });

  return { ok: true, submittedAt: new Date().toISOString() };
}
```

---

## Задание 3. Client form

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
        <h2>Спасибо!</h2>
        <p className="muted">Мы ответим на {state.submittedAt.slice(0, 10)}…</p>
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
        Сообщение
        <textarea name="message" required rows={5} minLength={10} />
        {state?.fieldErrors?.message?.map((m) => (
          <span key={m} className="error">{m}</span>
        ))}
      </label>

      {state && !state.ok && state.error ? (
        <p role="alert" className="error">{state.error}</p>
      ) : null}

      <button type="submit" disabled={pending}>
        {pending ? "Отправка…" : "Отправить"}
      </button>
    </form>
  );
}
```

---

## Задание 4. Server page

```tsx
// app/contact/page.tsx
import type { Metadata } from "next";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Контакты",
};

export default function ContactPage() {
  return (
    <section>
      <h1>Обратная связь</h1>
      <p className="muted">
        Форма работает через Server Action — попробуйте отключить JS и отправить снова.
      </p>
      <ContactForm />
    </section>
  );
}
```

---

## Задание 5. Проверки

| Тест | Ожидание |
|------|----------|
| Валидная отправка | success UI, log в terminal Next |
| email `not-an-email` | ошибка Zod |
| message `short` | min length error |
| JS disabled | form POST, redirect/render ok |
| Double click | `pending` блокирует кнопку |

DevTools → Network: при client submit — **`POST` к текущему URL** (Next Action protocol), не отдельный `/api/contact`.

---

## Бонус: plain HTML fallback

Дублируйте минимальную server-only форму для сравнения:

```tsx
// фрагмент page.tsx — optional
import { submitContact } from "./actions";

// <form action={submitContact}> без useActionState — только server messages через redirect?searchParams
```

Или используйте `redirect("/contact?sent=1")` после success в action для no-JS UX.

---

## Критерии приёмки

- [ ] Zod-валидация на сервере
- [ ] `useActionState` + pending
- [ ] Field-level errors
- [ ] Success state после отправки
- [ ] Log в server console (не alert с PII)
- [ ] (Бонус) success через query + no JS

---

## Частые проблемы

| Симптом | Решение |
|---------|---------|
| Action not found | `"use server"` в actions.ts |
| Form не отправляется | `name` на inputs |
| Hydration mismatch | не используйте `Date.now()` в server page для client |
| Infinite pending | action должна return state |

---

Следующий урок: [23. Middleware: rewrite, redirect, headers](23-middleware.md).
