# 05. Children, composition, slots

## Введение: сценарий с работы

Тикет: «Общий layout для shop — header, footer, контент по-разному на каталоге, корзине и checkout». Джун наследует `BasePage extends React.Component` из старого туториала 2017 года и ломает типы. Senior предлагает **композицию**: `ShopLayout` принимает **children** — произвольное дерево внутри `<main>`. На странице каталога — фильтр + сетка карточек; на корзине — таблица line items. Один layout, разное содержимое **без** наследования классов.

React официально рекомендует **composition over inheritance** — как в Go «embed by struct», а не deep hierarchy. В mock-exams shop это `AppShell` вокруг Router outlet, `Card` вокруг `ProductCard`, modal с формой внутри.

## Что вы узнаете

- Специальный prop **`children`** и его типы в TS.
- **Composition** — сборка UI из маленьких компонентов.
- Почему **наследование компонентов** — антипаттерн в React.
- **Layout-комponents**: shell, panel, card с slot для контента.
- Паттерн **«several optional slots»** через props (не только children).
- Связь с будущим Router layout ([24-nested-routes.md](24-nested-routes.md)).

## Prop `children`

В JSX всё **между** открывающим и закрывающим тегом — `children`:

```tsx
type ShopLayoutProps = {
  children: React.ReactNode;
};

export function ShopLayout({ children }: ShopLayoutProps) {
  return (
    <div className="shop-layout">
      <header>
        <h1>mock-exams Shop</h1>
        <p>API: FastAPI :8090</p>
      </header>
      <main>{children}</main>
      <footer>© mock-exams</footer>
    </div>
  );
}
```

Использование:

```tsx
export function App() {
  return (
    <ShopLayout>
      <section className="catalog">
        <h2>Каталог</h2>
        <p>Скоро — данные с API.</p>
      </section>
    </ShopLayout>
  );
}
```

Эквивалент без nesting — явная передача (редко нужно):

```tsx
<ShopLayout children={<section>...</section>} />
```

### Тип `React.ReactNode`

Принимает почти всё renderable: JSX, string, number, fragment, массив, `null`, `undefined`. Для **только одного элемента** иногда `React.ReactElement`; для render-prop — функция (продвинуто, [28-custom-hooks.md](28-custom-hooks.md)).

## Composition vs inheritance

**Плохой путь (наследование):**

```text
BaseProductPage
  ├── CatalogPage
  └── CartPage   // override renderFooter()? fragile
```

**React-way (композиция):**

```tsx
function PageSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function CatalogPage() {
  return (
    <PageSection title="Каталог">
      <FilterBar />
      <ProductGrid />
    </PageSection>
  );
}
```

Поведение и разметку **комбинируют**, а не переопределяют методы предка. Общую логику выносят в **hooks**, не в base class.

## Layout-комponents shop

Типичная оболочка SPA:

```tsx
type AppShellProps = {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
};

export function AppShell({ children, sidebar }: AppShellProps) {
  return (
    <div className="app-shell">
      <nav className="app-shell__nav">Catalog · Cart · Admin</nav>
      <div className="app-shell__body">
        {sidebar && <aside className="app-shell__sidebar">{sidebar}</aside>}
        <div className="app-shell__content">{children}</div>
      </div>
    </div>
  );
}
```

Здесь **два слота**: основной `children` и optional `sidebar` — фильтры категорий без хаков с `children[0]`.

### Card как wrapper

```tsx
type CardProps = {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function Card({ title, children, footer }: CardProps) {
  return (
    <article className="card">
      <header className="card__header">{title}</header>
      <div className="card__body">{children}</div>
      {footer && <footer className="card__footer">{footer}</footer>}
    </article>
  );
}
```

```tsx
<Card
  title="Mechanical Keyboard"
  footer={<button type="button">В корзину</button>}
>
  <p>€ 79.99</p>
  <p>Cherry MX switches</p>
</Card>
```

`ProductCard` из [04-props.md](04-props.md) может **использовать** `Card` внутри — слои композиции.

## Несколько «слотов» через props

Когда одного `children` мало (header actions + body):

```tsx
type PanelProps = {
  heading: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

function Panel({ heading, actions, children }: PanelProps) {
  return (
    <div className="panel">
      <div className="panel__top">
        <div>{heading}</div>
        {actions}
      </div>
      {children}
    </div>
  );
}
```

React Router 6 layout routes — тот же принцип: `<Outlet />` как «slot» для вложенного маршрута.

## Children и списки

`children` — **не** массив props автоматически; один prop. Несколько корней внутри — React собирает в один `children` (часто fragment неявно не нужен, если один родитель в JSX).

Для **явного** списка однотипных элементов — map у родителя ([07-lists-keys.md](07-lists-keys.md)), не `React.Children.map` без нужды.

## Связь с FastAPI shop

Layout не знает про HTTP. Родитель страницы:

1. Загружает items с `:8090` (позже).
2. Оборачивает в `ShopLayout`.
3. В `children` рендерит `<ProductGrid products={items} />`.

Separation: **layout** = chrome; **page** = data + composition.

## Типичные ошибки

| Ошибка | Корневая причина | Исправление |
|--------|------------------|-------------|
| `children` не типизирован (`any`) | Слабый TS | `React.ReactNode` |
| Логика fetch в Layout | Смешение слоёв | Data в page, layout только UI |
| `props.children.props` | Залезание внутрь children | Explicit slots props |
| Один giant children с 500 строк | Нет декомposition | Разбить на компоненты |
| Наследование «BaseButton» | OOP-привычка | Композиция + variant prop |
| `{sidebar && sidebar}` когда `0` | Falsy number | `sidebar != null &&` |

## Резюме

**Children** — содержимое между тегами компонента; основной механизм **композиции**. **Layout-комponents** задают каркас shop SPA; контент страниц вкладывается снаружи. **Optional slots** (`sidebar`, `footer`) дополняют один `children`. Наследование UI-классов не используют — комбинируют функции и hooks.

## Чек-лист

- [ ] Что попадает в `children`?
- [ ] Объясните «composition over inheritance» на примере shop layout
- [ ] Когда нужен prop кроме `children` (sidebar, actions)?
- [ ] Чем `React.ReactNode` отличается от `ReactElement`?
- [ ] Где будет жить `<Outlet />` в Router layout?

Следующий урок: [06. Лаба: карточка товара](06-lab-props.md).
