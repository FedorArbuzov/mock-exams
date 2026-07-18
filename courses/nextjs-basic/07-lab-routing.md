# 07. Лаба: маршруты `/catalog` и `/catalog/[id]`

## Зачем эта лаба

Теория [04–06](04-routing.md) дала file-based routing, dynamic `[id]` и `loading.tsx`. **Лаба** собирает **shop catalog flow**: список → карточка товара с skeleton при загрузке. Пока без FastAPI — hardcoded ids; в [15-lab-server-fetch.md](15-lab-server-fetch.md) подставите `fetch` к **:8090**.

На работе PR «Add product detail route» выглядит так же: `app/catalog/[id]/page.tsx`, nested layout, loading states — до интеграции с API.

## Предварительно

- Выполнена [03. Лаба](03-lab-first-app.md) (`/catalog` placeholder).
- Прочитаны [05. Dynamic routes](05-dynamic-routes.md) и [06. Layouts](06-layouts-templates.md).
- Dev-сервер в **`courses/nextjs-basic/examples/`**:

```bash
cd courses/nextjs-basic/examples
npm run dev
```

Эталоны — [`examples/solutions/07-routing/`](examples/solutions/) — **после** своей попытки.

---

## Задание 1. Catalog layout с sidebar

**Контекст:** общий chrome каталога — один layout, не копировать в page.

Создайте `app/catalog/layout.tsx`:

```tsx
export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="catalog-layout" style={{ display: "flex", gap: "1.5rem" }}>
      <aside className="card" style={{ minWidth: 180, padding: "1rem" }}>
        <strong>Фильтры</strong>
        <p className="muted" style={{ fontSize: "0.875rem" }}>
          Placeholder до server fetch
        </p>
      </aside>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}
```

Откройте `/catalog` — sidebar должен появиться.

**Критерий:** sidebar виден на `/catalog` и останется на `/catalog/[id]`.

---

## Задание 2. Обновить страницу каталога — список ссылок

**Контекст:** имитация списка SKU до API.

Замените содержимое `app/catalog/page.tsx`:

```tsx
import Link from "next/link";

const PLACEHOLDER_ITEMS = [
  { id: "sku-001", title: "Кроссовки Runner" },
  { id: "sku-002", title: "Рюкзак City" },
  { id: "sku-003", title: "Футболка Basic" },
];

export default function CatalogPage() {
  return (
    <section>
      <h1>Каталог</h1>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {PLACEHOLDER_ITEMS.map((item) => (
          <li key={item.id} className="card" style={{ marginBottom: "0.75rem", padding: "1rem" }}>
            <Link href={`/catalog/${item.id}`}>{item.title}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

**Критерий:** три ссылки ведут на `/catalog/sku-00X`.

---

## Задание 3. Dynamic page `[id]`

**Контекст:** URL-driven detail — основа SSR товара.

Создайте `app/catalog/[id]/page.tsx`:

```tsx
type PageProps = {
  params: Promise<{ id: string }>;
};

const MOCK: Record<string, { title: string; price: number }> = {
  "sku-001": { title: "Кроссовки Runner", price: 8990 },
  "sku-002": { title: "Рюкзак City", price: 4590 },
  "sku-003": { title: "Футболка Basic", price: 1990 },
};

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = MOCK[id];

  if (!product) {
    return (
      <section>
        <h1>Товар не найден</h1>
        <p className="muted">id: {id}</p>
      </section>
    );
  }

  return (
    <section>
      <h1>{product.title}</h1>
      <p>{product.price.toLocaleString("ru-RU")} ₽</p>
      <p className="muted">SKU: {id} · данные с :8090 в уроке 15</p>
    </section>
  );
}
```

Проверьте `/catalog/sku-001` и `/catalog/unknown`.

**Критерий:** `await params`; известные ids показывают title/price.

---

## Задание 4. loading.tsx для catalog и [id]

**Контекст:** UX при медленном fetch — skeleton до урока 15.

Создайте `app/catalog/loading.tsx`:

```tsx
export default function CatalogLoading() {
  return <p className="muted" aria-busy="true">Загрузка списка…</p>;
}
```

Создайте `app/catalog/[id]/loading.tsx`:

```tsx
export default function ProductLoading() {
  return (
    <div className="card" aria-busy="true">
      <div style={{ height: 24, width: "60%", background: "#eee" }} />
      <div style={{ height: 16, width: "30%", background: "#eee", marginTop: 12 }} />
    </div>
  );
}
```

Чтобы увидеть skeleton, временно в `[id]/page.tsx` добавьте:

```tsx
await new Promise((r) => setTimeout(r, 800));
```

перед return. **Удалите** delay после проверки.

**Критерий:** при искусственной задержке виден skeleton, не белый main.

---

## Задание 5. Navigation smoke

**Контекст:** layout sidebar не должен «мигать».

1. `/catalog` → клик товар → `/catalog/sku-002`
2. Back → forward
3. Sidebar «Фильтры» остаётся на месте

**Критерий:** nested layout persist (теория 06).

---

## Критерии успеха

- [ ] `app/catalog/layout.tsx` с sidebar
- [ ] `app/catalog/page.tsx` со ссылками через `<Link>`
- [ ] `app/catalog/[id]/page.tsx` с `await params`
- [ ] `loading.tsx` на catalog и [id]
- [ ] `npm run build` успешен

## Если что-то пошло не так

| Симптом | Проверка |
|---------|----------|
| `/catalog/[id]` 404 | Папка буквально `[id]`, внутри `page.tsx` |
| `params.id` undefined | `await params` (Next 15) |
| Sidebar пропадает | Layout в `app/catalog/layout.tsx`, не в page |
| loading не показывается | Есть async delay или fetch? sync page — мгновенно |
| Link full reload | Используйте `next/link`, не `<a href>` |
| Build: duplicate slug | Два page на один path? |

## Связь с курсом

| Шаг | Урок |
|-----|------|
| Soft navigation | [08-navigation.md](08-navigation.md) |
| Server fetch items | [15-lab-server-fetch.md](15-lab-server-fetch.md) |
| notFound() | [18-error-not-found.md](18-error-not-found.md) |

Следующий урок (теория): [08. Link, useRouter, soft navigation](08-navigation.md).
