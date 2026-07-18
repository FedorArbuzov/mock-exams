# 03. Лаба: первое приложение

## Зачем эта лаба

Теория [00–02](00-environment.md) объяснила Vite, JSX и компоненты. **Лаба** переводит это в мышечную память: вы не читаете про HMR — вы **сохраняете файл** и видите обновление без F5. На работе тот же цикл: тикет «добавить заголовок в shop catalog», ветка, правка `App.tsx`, `npm run dev`, скриншот в PR.

Цель — не «скопировать Hello World», а привыкнуть к:

1. **Каталог `examples/`** как единице работы (git, CI, `npm run build`).
2. **Отдельному файлу компонента** + import в `App.tsx`.
3. **HMR** — быстрая обратная связь; ошибка JSX — сразу overlay в браузере.
4. **Typecheck** — `npm run typecheck` ловит опечатки до деплоя.

Домен **shop** пока минимален (заголовок, приветствие). Те же файлы позже примут `ProductCard` ([06-lab-props.md](06-lab-props.md)) и данные с FastAPI `:8090` ([18-cors-fastapi.md](18-cors-fastapi.md)).

## Предварительно

- Node **LTS 20+**, прочитаны [00. Окружение](00-environment.md) и [02. JSX](02-jsx-components.md).
- Вы в **`courses/react-basic/examples/`**:

```bash
cd courses/react-basic/examples
npm install
npm run dev
```

Откройте URL из терминала (обычно `http://localhost:5173`). Должен быть заголовок «Shop — react-basic».

Эталоны — [`examples/solutions/03-first-app/`](examples/solutions/) — **после** своей попытки.

---

## Задание 1. Компонент Hello

**Контекст:** в monorepo каждый UI-блок — отдельный файл для code review и tree-shaking.

Создайте `src/components/Hello.tsx`:

```tsx
export function Hello() {
  return (
    <section className="hello">
      <h2>Добро пожаловать в shop</h2>
      <p>React-клиент mock-exams. API — FastAPI на порту 8090.</p>
    </section>
  );
}
```

**Критерий:** файл компилируется, `className` (не `class`), один корневой `<section>`.

---

## Задание 2. Подключить Hello в App

**Контекст:** `App` — корень дерева компонентов ([01-landscape.md](01-landscape.md)).

Отредактируйте [`src/App.tsx`](examples/src/App.tsx):

```tsx
import { Hello } from "./components/Hello";

export function App() {
  return (
    <main className="app">
      <h1>Shop — react-basic</h1>
      <Hello />
    </main>
  );
}
```

Сохраните файл. **Не обновляйте браузер вручную** — проверьте, что текст из `Hello` появился (HMR).

**Критерий:** на странице заголовок h1 и блок из `Hello`.

---

## Задание 3. Намеренная ошибка и overlay

**Контекст:** в CI `vite build` строже, чем «случайно работающий» dev.

В `Hello.tsx` временно замените закрывающий `</section>` на `</div>`. Посмотрите overlay ошибки в браузере и сообщение в терминале Vite.

Верните правильный тег. Запустите:

```bash
npm run typecheck
```

**В комментарии вверху `Hello.tsx`** (1–2 предложения): зачем проверять сборку локально, а не только dev.

---

## Задание 4. Мини-разметка shop

**Контекст:** будущий header каталога — logo + subtitle.

Добавьте в `App.tsx` под `<h1>`:

```tsx
<p className="app-subtitle">
  Локальная разработка · backend опционально до урока 18
</p>
```

В `src/index.css` (опционально) добавьте:

```css
.app-subtitle {
  color: #666;
  margin-top: 0;
}
```

Сохраните — убедитесь, что стили подхватились через HMR.

---

## Задание 5. Production smoke

**Контекст:** перед merge в main pipeline гоняет `npm run build`.

```bash
npm run build
npm run preview
```

Откройте URL preview (обычно `:4173`). Страница должна совпадать с dev по содержимому.

**Критерий:** `dist/` создан без ошибок; preview показывает Hello.

---

## Критерии успеха

- [ ] `src/components/Hello.tsx` с named export
- [ ] `App.tsx` импортирует и рендерит `<Hello />`
- [ ] Видели HMR при сохранении (без полного reload)
- [ ] Исправили намеренную JSX-ошибку; `npm run typecheck` зелёный
- [ ] `npm run build` и `preview` успешны

## Если что-то пошло не так

| Симптом | Проверка |
|---------|----------|
| `Failed to resolve import "./components/Hello"` | Файл существует? Регистр пути на Linux CI |
| Белый экран, ошибка в консоли | DevTools → Console; часто опечатка в export |
| HMR не срабатывает | Сохранили файл? Иногда помогает перезапуск `npm run dev` |
| `Cannot find module 'react'` | `npm install` в `examples/` |
| Typecheck падает на `className` | Убедитесь, что файл `.tsx`, не `.ts` |

## Связь с курсом

| Следующий шаг | Зачем |
|--------------|-------|
| [04. Props](04-props.md) | передача title, price в карточку |
| [06. Лаба: ProductCard](06-lab-props.md) | shop-компонент с данными |
| [18. CORS и FastAPI](18-cors-fastapi.md) | живой каталог с :8090 |

Следующий урок (теория): [04. Props: передача данных вниз](04-props.md).
