# 34. Accessibility in an admin SPA

## A story from work

After the admin SPA ships, a compliance audit finds blockers: the products table isn't keyboard-navigable, the delete modal's focus trap is broken, and form errors are only a red border with no text for a screen reader. Legal escalation: "WCAG 2.1 AA for internal tools is also a requirement, not just the public site."

Accessibility (a11y) isn't an "extra checkbox" — it's **UX quality** for everyone: keyboard power users in support, screen readers, 200% zoom.

## What you'll learn

- Semantic HTML in admin: table, form, nav, button vs div
- Keyboard: focus order, roving tabindex, shortcuts
- ARIA: when it's needed, when it's harmful
- Focus management: modals, route change, errors
- Live regions for async feedback

---

## Semantic foundation

| Anti-pattern | Fix |
|--------------|-----|
| `<div onClick={...}>` | `<button type="button">` |
| `<span>` as heading | `<h1>`–`<h6>` hierarchy |
| Layout `<table>` for a grid | CSS grid; `<table>` only for tabular data |
| Placeholder as the only label | `<label htmlFor="sku">` visible or sr-only |

The admin products table — a **real** `<table>`:

```tsx
<table>
  <caption className="sr-only">Product list</caption>
  <thead>
    <tr>
      <th scope="col">SKU</th>
      <th scope="col">Title</th>
      <th scope="col" aria-sort={sortState}>Price</th>
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
- `aria-describedby` — links input ↔ hint/error

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

**Tab order** follows the visual order. `tabIndex={0}` on a non-interactive element only for a custom widget.

**Skip link** in the layout:

```tsx
<a href="#main-content" className="skip-link">
  Skip to content
</a>
<main id="main-content" tabIndex={-1}>
  <Outlet />
</main>
```

`tabIndex={-1}` on main — programmatic focus after a route change:

```tsx
const mainRef = useRef<HTMLElement>(null);
const location = useLocation();

useEffect(() => {
  mainRef.current?.focus();
}, [location.pathname]);
```

---

## Modals and focus trap

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
        Cancel
      </button>
      <button type="button" onClick={onConfirm}>
        Delete
      </button>
    </div>
  );
}
```

Production: `@radix-ui/react-dialog` or focus-trap-react — a full trap + focus restore.

**Rule:** when the modal closes, return focus to the trigger button.

---

## Async states

| State | Pattern |
|-------|---------|
| Loading list | `aria-busy="true"` on the table region |
| Background refetch | `aria-live="polite"` "Updating…" |
| Error | `role="alert"` + focusable retry button |
| Toast success | `aria-live="polite"` region |

```tsx
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {isFetching ? "Loading table data" : ""}
</div>
```

Don't overuse `aria-live="assertive"` — it interrupts the screen reader.

---

## ARIA — rules

1. **First rule of ARIA:** don't use it if a native element exists.
2. `aria-label` on icon-only buttons: `<button aria-label="Delete product KB-001">`.
3. `aria-expanded` on a disclosure/sidebar toggle.
4. `aria-current="page"` on the active nav link.
5. Don't duplicate native semantics (`role="button"` on a `<button>` — redundant).

---

## Color and contrast

- An error isn't just a red border — the message text is required.
- Contrast ratio 4.5:1 for body text (AA).
- A visible focus ring — don't use `outline: none` without a replacement.

```css
:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}
```

---

## Admin table specifics

- Sort buttons in `<th>` — real `<button>`, `aria-sort`.
- Pagination: `<nav aria-label="Pagination">`.
- Row actions: not hover-only — visible on focus too.

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

## Lab (short version)

1. Audit `ProductsTablePage` + `ProductForm` with axe DevTools or Lighthouse.
2. Fix: labels, aria-invalid, table caption, dialog focus.
3. Keyboard-only pass: login → list → open detail → edit → save → delete cancel.

**Success criterion:** zero critical axe violations on the main flows; the full flow works without a mouse.

---

## Common mistakes

1. **`onClick` on a div** — not keyboard accessible.

2. **Focus lost on route change** — disorienting; focus main.

3. **Modal without Escape** — a trap with no exit.

4. **Icon button without a label** — only "button" is announced.

5. **Auto-focus on every render** — focus steal; only on intentional open/route.

6. **aria-hidden on focusable children** — forbidden.

---

## Checklist

- [ ] Buttons/links native; forms labeled
- [ ] Errors: text + aria-invalid + describedby
- [ ] Modals: dialog role, focus trap, restore
- [ ] Table: th scope, caption, sort aria-sort
- [ ] Loading/error: live regions / alerts
- [ ] Focus visible; keyboard E2E pass
- [ ] axe/Lighthouse smoke on catalog admin pages

---

## Related

| Resource | |
|--------|---|
| [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/) | the official checklist |
| [34-accessibility — react-basic](../react-basic/README.md) | basic patterns |
| [javascript-testing](../javascript-path.md) | axe in e2e |

---

[← 33-zustand-ui](33-zustand-ui.md) · [35-security-client →](35-security-client.md)
