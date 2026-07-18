# 34. Accessibility в admin SPA

## Сценарий с работы

После релиза admin SPA compliance-аудит находит блокеры: таблица товаров не navigable с клавиатуры, модалка delete trap focus сломан, ошибки формы только красной рамкой без текста для screen reader. Legal escalation: «WCAG 2.1 AA для internal tools — тоже requirement, не только public site».

Accessibility (a11y) — не «дополнительная галочка», а **качество UX** для всех: keyboard power users в support, screen reader, zoom 200%.

## Что вы узнаете

- Semantic HTML в admin: table, form, nav, button vs div
- Keyboard: focus order, roving tabindex, shortcuts
- ARIA: когда нужен, когда вреден
- Focus management: modals, route change, errors
- Live regions для async feedback

---

## Semantic foundation

| Anti-pattern | Fix |
|--------------|-----|
| `<div onClick={...}>` | `<button type="button">` |
| `<span>` as heading | `<h1>`–`<h6>` hierarchy |
| Layout `<table>` для grid | CSS grid; `<table>` только tabular data |
| Placeholder as only label | `<label htmlFor="sku">` visible or sr-only |

Admin products table — **настоящая** `<table>`:

```tsx
<table>
  <caption className="sr-only">Список товаров</caption>
  <thead>
    <tr>
      <th scope="col">SKU</th>
      <th scope="col">Название</th>
      <th scope="col" aria-sort={sortState}>Цена</th>
    </tr>
  </thead>
  <tbody>...</tbody>
</table>
```

---

## Forms ([28-forms-rhf.md](28-forms-rhf.md))

```tsx
<label htmlFor="sku">SKU</label>
<input
  id="sku"
  aria-invalid={errors.sku ? true : undefined}
  aria-describedby={errors.sku ? "sku-error" : undefined}
  {...register("sku")}
/>
{errors.sku && (
  <span id="sku-error" role="alert">
    {errors.sku.message}
  </span>
)}
```

- `aria-invalid` — programmatic error state
- `role="alert"` — announce on appear
- `aria-describedby` — связь input ↔ hint/error

Submit errors (non-field):

```tsx
{formError && (
  <div role="alert" className="form-banner">
    {formError}
  </div>
)}
```

---

## Keyboard navigation

**Tab order** следует visual order. `tabIndex={0}` на non-interactive только если custom widget.

**Skip link** в layout:

```tsx
<a href="#main-content" className="skip-link">
  Перейти к содержимому
</a>
<main id="main-content" tabIndex={-1}>
  <Outlet />
</main>
```

`tabIndex={-1}` на main — programmatic focus после route change:

```tsx
const mainRef = useRef<HTMLElement>(null);
const location = useLocation();

useEffect(() => {
  mainRef.current?.focus();
}, [location.pathname]);
```

---

## Modals и focus trap

Delete confirm dialog:

```tsx
function ConfirmDialog({ open, title, onConfirm, onCancel }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      onKeyDown={(e) => e.key === "Escape" && onCancel()}
    >
      <h2 id="dialog-title">{title}</h2>
      <button ref={cancelRef} type="button" onClick={onCancel}>
        Отмена
      </button>
      <button type="button" onClick={onConfirm}>
        Удалить
      </button>
    </div>
  );
}
```

Production: `@radix-ui/react-dialog` или focus-trap-react — полный trap + restore focus.

**Правило:** при закрытии modal вернуть focus на trigger button.

---

## Async states

| State | Pattern |
|-------|---------|
| Loading list | `aria-busy="true"` на table region |
| Background refetch | `aria-live="polite"` «Обновление…» |
| Error | `role="alert"` + retry button focusable |
| Toast success | `aria-live="polite"` region |

```tsx
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {isFetching ? "Загрузка данных таблицы" : ""}
</div>
```

Не overuse `aria-live="assertive"` — interrupts screen reader.

---

## ARIA — правила

1. **First rule of ARIA:** не используйте, если есть native element.
2. `aria-label` на icon-only buttons: `<button aria-label="Удалить товар KB-001">`.
3. `aria-expanded` на disclosure/sidebar toggle.
4. `aria-current="page"` на active nav link.
5. Не дублируйте native semantics (`role="button"` на `<button>` — redundant).

---

## Color и contrast

- Error не только red border — текст сообщения обязателен.
- Contrast ratio 4.5:1 для body text (AA).
- Focus visible ring — не `outline: none` без replacement.

```css
:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}
```

---

## Admin table specifics

- Sort buttons in `<th>` — real `<button>`, `aria-sort`.
- Pagination: `<nav aria-label="Пагинация">`.
- Row actions: не hover-only — visible on focus too.

```css
.row-actions {
  opacity: 0;
}
tr:focus-within .row-actions,
.row-actions:focus-within {
  opacity: 1;
}
```

---

## Лаба (кратко)

1. Audit `ProductsTablePage` + `ProductForm` с axe DevTools или Lighthouse.
2. Fix: labels, aria-invalid, table caption, dialog focus.
3. Keyboard-only pass: login → list → open detail → edit → save → delete cancel.

**Критерий:** zero critical axe violations на main flows; full flow без mouse.

---

## Типичные ошибки

1. **`onClick` on div** — not keyboard accessible.

2. **Focus lost on route change** — disorienting; focus main.

3. **Modal без Escape** — trap without exit.

4. **Icon button без label** — «button» announced only.

5. **Auto-focus на каждый render** — focus steal; only on intentional open/route.

6. **aria-hidden on focusable children** — forbidden.

---

## Чек-лист

- [ ] Buttons/links native; forms labeled
- [ ] Errors: text + aria-invalid + describedby
- [ ] Modals: dialog role, focus trap, restore
- [ ] Table: th scope, caption, sort aria-sort
- [ ] Loading/error: live regions / alerts
- [ ] Focus visible; keyboard E2E pass
- [ ] axe/Lighthouse smoke on catalog admin pages

---

## Связь

| Ресурс | |
|--------|---|
| [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/) | официальный чеклист |
| [34-accessibility — react-basic](../react-basic/README.md) | базовые patterns |
| [javascript-testing](../javascript-path.md) | axe in e2e |

---

[← 33-zustand-ui](33-zustand-ui.md) · [35-security-client →](35-security-client.md)
