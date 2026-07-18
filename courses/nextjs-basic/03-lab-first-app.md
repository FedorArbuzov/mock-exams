# 03. Лаба: первое Next.js-приложение

## Зачем эта лаба

Теория [00–02](00-environment.md) объяснила `create-next-app`, ландшафт SSR/SPA и структуру `app/`. **Лаба** переводит это в мышечную память: вы не читаете про file-based routing — вы **создаёте** `app/catalog/page.tsx` и видите URL `/catalog` без React Router config.

На работе тот же цикл: тикет «добавить placeholder каталога», ветка, правки в `app/`, `npm run dev` на **:3000**, скриншот в PR. Домен **shop** продолжается из react-basic; позже страницы примут данные с FastAPI **:8090** ([15-lab-server-fetch.md](15-lab-server-fetch.md)).

## Предварительно

- Node **LTS 20+**, прочитаны [00. Окружение](00-environment.md) и [02. App Router](02-app-router.md).
- Вы в **`courses/nextjs-basic/examples/`**:

```bash
cd courses/nextjs-basic/examples
npm install
npm run dev
```

Откройте **http://localhost:3000**. Должны быть header с ссылками и заголовок «Shop — nextjs-basic».

Эталоны — [`examples/solutions/03-first-app/`](examples/solutions/) — **после** своей попытки.

---

## Задание 1. Изучить стартовый layout

**Контекст:** header в **одном** месте — root layout, не копировать в каждую page.

Откройте [`app/layout.tsx`](examples/app/layout.tsx). Убедитесь:

- `<html lang="ru">`, `<body>`, `<main>{children}</main>`
- `<Link href="/catalog">` уже есть — пока ведёт на 404

**Критерий:** можете объяснить, почему nav виден на `/`, даже если правите только `page.tsx`.

---

## Задание 2. Страница каталога (placeholder)

**Контекст:** product хочет «хотя бы маршрут каталога» до подключения API.

Создайте `app/catalog/page.tsx`:

```tsx
export default function CatalogPage() {
  return (
    <section>
      <h1>Каталог</h1>
      <p className="muted">
        Placeholder: список товаров появится после server fetch (урок 15).
        API — FastAPI :8090.
      </p>
      <ul className="card" style={{ marginTop: "1rem", listStyle: "none", padding: "1rem" }}>
        <li>Товар A — скоро</li>
        <li>Товар B — скоро</li>
        <li>Товар C — скоро</li>
      </ul>
    </section>
  );
}
```

Сохраните. Перейдите по **Каталог** в header или откройте `/catalog`.

**Критерий:** URL `/catalog`, заголовок h1, header не исчез.

---

## Задание 3. Страница «Контакты»

**Контекст:** проверка, что вы понимаете **один segment = одна папка**.

Создайте `app/contact/page.tsx`:

```tsx
export default function ContactPage() {
  return (
    <section>
      <h1>Контакты</h1>
      <p>shop@mock-exams.local · поддержка в capstone.</p>
    </section>
  );
}
```

Проверьте ссылку **Контакты** в layout (`/contact`).

**Критерий:** три маршрута работают: `/`, `/catalog`, `/contact`.

---

## Задание 4. Улучшить home page

**Контекст:** главная — hub с CTA в каталог.

В [`app/page.tsx`](examples/app/page.tsx) добавьте после intro-карточки:

```tsx
<p style={{ marginTop: "1rem" }}>
  <a href="/catalog">Перейти в каталог →</a>
</p>
```

*Замечание:* здесь намеренно `<a>` — в [08-navigation.md](08-navigation.md) замените на `<Link>`.

**Критерий:** с главной можно перейти в каталог (полная перезагрузка — ок для лабы).

---

## Задание 5. Typecheck и build smoke

**Контекст:** CI гоняет `next build` — ловите ошибки до push.

```bash
npm run typecheck
npm run build
npm run start
```

Откройте **http://localhost:3000** (production mode). Проверьте `/catalog`.

**Критерий:** build без ошибок; страницы открываются.

---

## Критерии успеха

- [ ] `app/catalog/page.tsx` и `app/contact/page.tsx` созданы
- [ ] Header из layout виден на всех трёх маршрутах
- [ ] `npm run typecheck` зелёный
- [ ] `npm run build` успешен
- [ ] Понимаете, где добавлять новый URL (папка + `page.tsx`)

## Если что-то пошло не так

| Симптом | Проверка |
|---------|----------|
| `/catalog` 404 | Файл именно `app/catalog/page.tsx`? dev-сервер перезапущен после создания папки? |
| Нет header на `/catalog` | Не создавали отдельный layout без `{children}`? Используйте root layout |
| `Page.tsx` not found | Имя файла lowercase: `page.tsx` |
| Белый экран | Terminal Next — stack trace; часто синтаксис в новом page |
| `Cannot find module 'next'` | `npm install` в `examples/` |
| Порт не 3000 | Вы в `nextjs-basic/examples`, не react-basic |

## Связь с курсом

| Следующий шаг | Зачем |
|---------------|-------|
| [04. File-based routing](04-routing.md) | вложенность, index routes, route groups |
| [07. Лаба: catalog/[id]](07-lab-routing.md) | dynamic segment |
| [15. Лаба: fetch с :8090](15-lab-server-fetch.md) | живые товары |

Следующий урок (теория): [04. File-based routing: сегменты и вложенность](04-routing.md).
