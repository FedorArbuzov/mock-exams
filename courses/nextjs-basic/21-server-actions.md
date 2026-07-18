# 21. Server Actions: формы без отдельного API

## Введение: сценарий с работы

Форма «Напишите нам» на `/contact`: продукт хочет **работу без JavaScript** (accessibility, SEO), а backend требует POST с валидацией. Разработчик пишет Route Handler + `fetch` из client form — 80 строк boilerplate, дублирование Zod, CSRF-вопросы. Альтернатива из Next.js 14+ — **Server Actions**: async-функции на сервере, вызываемые напрямую из `<form action={...}>`.

Server Action — не замена FastAPI для всего API, но **идеальный инструмент для мутаций из UI**: feedback, subscribe, «добавить в избранное» с `revalidatePath`. Лаба [22-lab-server-actions.md](22-lab-server-actions.md) соберёт контактную форму.

## Что вы узнаете

- `"use server"` — file vs inline
- `<form action={submit}>` без client JS
- `FormData`, валидация, ошибки полей
- `revalidatePath` / `revalidateTag` после мутации
- `redirect()` после успеха
- `useFormStatus`, `useActionState` (client helpers)
- Server Actions vs Route Handlers

---

## Минимальная Server Action

```tsx
// app/contact/actions.ts
"use server";

import { revalidatePath } from "next/cache";

export async function submitContact(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!email.includes("@")) {
    return { ok: false as const, error: "Некорректный email" };
  }
  if (message.length < 10) {
    return { ok: false as const, error: "Сообщение слишком короткое" };
  }

  // Имитация сохранения (FastAPI contact endpoint может отсутствовать)
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
      <h1>Контакты</h1>
      <form action={submitContact}>
        <label>
          Email
          <input name="email" type="email" required />
        </label>
        <label>
          Сообщение
          <textarea name="message" required minLength={10} />
        </label>
        <button type="submit">Отправить</button>
      </form>
    </section>
  );
}
```

Форма работает **без hydration** — браузер делает POST, Next вызывает action на сервере.

---

## `"use server"` — два стиля

| Стиль | Где | Когда |
|-------|-----|-------|
| **File-level** | первой строкой `actions.ts` | несколько actions в файле |
| **Inline** | внутри Server Component перед `async function` | одна action рядом с UI |

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

Файл с `"use server"` **не импортируется** в Client Component — только action references передаются через props (serializable).

---

## Progressive enhancement + client UI

Для сообщений об ошибках без full page reload — client wrapper:

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
      {/* поля */}
      {state && !state.ok ? (
        <p role="alert" className="error">{state.error}</p>
      ) : null}
      {state?.ok ? <p role="status">Спасибо! Мы ответим на email.</p> : null}
      <button type="submit" disabled={pending}>
        {pending ? "Отправка…" : "Отправить"}
      </button>
    </form>
  );
}
```

`useActionState` (React 19) — pending state + результат action. Без JS — plain form всё ещё работает через `action={submitContact}` на server page.

---

## `revalidatePath` после мутации

После изменения данных на backend кэш RSC устаревает ([16-caching-revalidate.md](16-caching-revalidate.md)):

```tsx
"use server";

import { revalidatePath, revalidateTag } from "next/cache";

export async function refreshCatalog() {
  revalidateTag("catalog-items");
  revalidatePath("/catalog");
}
```

Вызывайте **после успешной** мутации — не до валидации.

---

## `redirect()`

```tsx
"use server";

import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const ok = await verifyCredentials(formData);
  if (!ok) return { error: "Неверный пароль" };
  redirect("/account");
}
```

`redirect` бросает special error — не оборачивайте в try/catch без rethrow.

---

## Валидация с Zod

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

## Forward к FastAPI из Action

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
    return { ok: false as const, error: "Сервис временно недоступен" };
  }

  return { ok: true as const };
}
```

На стенде курса contact endpoint может отсутствовать — лаба использует server-side log.

---

## Безопасность

| Тема | Рекомендация |
|------|--------------|
| CSRF | Next Actions имеют built-in origin check (same-site POST) |
| Auth | проверяйте session в action ([27-auth-patterns.md](27-auth-patterns.md)) |
| Rate limit | middleware или in-action counter |
| Secrets | только server env |
| Idempotency | защита от double-submit (UI disabled + server idempotency key) |

---

## Server Actions vs Route Handlers

| Критерий | Server Action | Route Handler |
|----------|---------------|---------------|
| Прогрессивная форма | ✅ | возможно, но awkward |
| REST для mobile | ❌ | ✅ |
| Webhook от Stripe | ❌ | ✅ |
| `revalidatePath` | ✅ natural | ✅ вручную |
| Кэш CDN GET | N/A | настраивается |

---

## Ограничения

- Actions — **POST** under the hood; не для GET-read (используйте RSC fetch).
- Не вызывайте action из arbitrary client callback без form/`startTransition` patterns — используйте documented APIs.
- Большие файлы — `FormData` + storage (S3); лимиты body size на platform.

---

## Типичные ошибки

1. **`"use server"` в Client Component file** — build error.

2. **Импорт server action logic в client** — только импорт action function reference.

3. **Забыть `revalidatePath`** — UI показывает stale catalog после admin edit.

4. **Return несerializable** (Date, Map, class instance) — serialization error.

5. **try/catch глотает redirect** — rethrow NEXT_REDIRECT.

6. **Дублировать validation только на client** — server обязан валидировать.

7. **Action для read-only** — anti-pattern; лишний POST.

8. **Не обрабатывать pending** — double submit.

---

## Чек-лист

- Работает ли form action без JavaScript?
- Где объявить `"use server"` — file vs inline?
- Зачем `revalidatePath` после успешной отправки?
- Чем Action отличается от Route Handler POST?
- Как вернуть ошибку поля без throw?
- Можно ли из Action вызвать FastAPI с секретом?
- Что делает `redirect()` внутри action?

Следующий урок: [22. Лаба: форма обратной связи](22-lab-server-actions.md).
