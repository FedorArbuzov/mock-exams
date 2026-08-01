# 03. Lab: your first Next.js app

## Why this lab

The theory in [00–02](00-environment.md) explained `create-next-app`, the SSR/SPA landscape, and the structure of `app/`. The **lab** turns that into muscle memory: you don't read about file-based routing — you **create** `app/catalog/page.tsx` and see the URL `/catalog` without any React Router config.

At work it's the same cycle: a ticket "add a catalog placeholder", a branch, edits in `app/`, `npm run dev` on **:3000**, a screenshot in the PR. The **shop** domain continues from react-basic; later the pages will take data from FastAPI **:8090** ([15-lab-server-fetch.md](15-lab-server-fetch.md)).

## Prerequisites

- Node **LTS 20+**, and you've read [00. Environment](00-environment.md) and [02. App Router](02-app-router.md).
- You're in **`courses/nextjs-basic/examples/`**:

```bash
cd courses/nextjs-basic/examples
npm install
npm run dev
```

Open **http://localhost:3000**. You should see a header with links and the heading "Shop — nextjs-basic".

Reference solutions — [`examples/solutions/03-first-app/`](examples/solutions/) — **after** your own attempt.

---

## Task 1. Study the starter layout

**Context:** the header lives in **one** place — the root layout — not copied into every page.

Open [`app/layout.tsx`](examples/app/layout.tsx). Confirm:

- `<html lang="ru">`, `<body>`, `<main>{children}</main>`
- `<Link href="/catalog">` is already there — it currently leads to a 404

**Criterion:** you can explain why the nav is visible on `/` even if you only edit `page.tsx`.

---

## Task 2. Catalog page (placeholder)

**Context:** product wants "at least a catalog route" before the API is wired up.

Create `app/catalog/page.tsx`:

```tsx
export default function CatalogPage() {
  return (
    <section>
      <h1>Catalog</h1>
      <p className="muted">
        Placeholder: the product list will appear after server fetch (lesson 15).
        API — FastAPI :8090.
      </p>
      <ul className="card" style={{ marginTop: "1rem", listStyle: "none", padding: "1rem" }}>
        <li>Product A — coming soon</li>
        <li>Product B — coming soon</li>
        <li>Product C — coming soon</li>
      </ul>
    </section>
  );
}
```

Save. Navigate via **Catalog** in the header or open `/catalog`.

**Criterion:** the URL is `/catalog`, the h1 heading shows, and the header didn't disappear.

---

## Task 3. "Contacts" page

**Context:** a check that you understand **one segment = one folder**.

Create `app/contact/page.tsx`:

```tsx
export default function ContactPage() {
  return (
    <section>
      <h1>Contacts</h1>
      <p>shop@mock-exams.local · support in the capstone.</p>
    </section>
  );
}
```

Check the **Contacts** link in the layout (`/contact`).

**Criterion:** three routes work: `/`, `/catalog`, `/contact`.

---

## Task 4. Improve the home page

**Context:** the home page is a hub with a CTA into the catalog.

In [`app/page.tsx`](examples/app/page.tsx) add, after the intro card:

```tsx
<p style={{ marginTop: "1rem" }}>
  <a href="/catalog">Go to the catalog →</a>
</p>
```

*Note:* the `<a>` here is intentional — in [08-navigation.md](08-navigation.md) you'll replace it with `<Link>`.

**Criterion:** from the home page you can go to the catalog (a full reload is fine for the lab).

---

## Task 5. Typecheck and build smoke

**Context:** CI runs `next build` — catch errors before you push.

```bash
npm run typecheck
npm run build
npm run start
```

Open **http://localhost:3000** (production mode). Check `/catalog`.

**Criterion:** the build has no errors; the pages open.

---

## Success criteria

- [ ] `app/catalog/page.tsx` and `app/contact/page.tsx` are created
- [ ] The header from the layout is visible on all three routes
- [ ] `npm run typecheck` is green
- [ ] `npm run build` succeeds
- [ ] You understand where to add a new URL (a folder + `page.tsx`)

## If something went wrong

| Symptom | Check |
|---------|----------|
| `/catalog` 404 | Is the file exactly `app/catalog/page.tsx`? Did the dev server restart after you created the folder? |
| No header on `/catalog` | Did you create a separate layout without `{children}`? Use the root layout |
| `Page.tsx` not found | The file name is lowercase: `page.tsx` |
| Blank screen | The Next terminal shows a stack trace; often a syntax error in the new page |
| `Cannot find module 'next'` | Run `npm install` in `examples/` |
| Port isn't 3000 | You're in `nextjs-basic/examples`, not react-basic |

## Related to the course

| Next step | Why |
|---------------|-------|
| [04. File-based routing](04-routing.md) | nesting, index routes, route groups |
| [07. Lab: catalog/[id]](07-lab-routing.md) | dynamic segment |
| [15. Lab: fetch from :8090](15-lab-server-fetch.md) | live products |

Next lesson (theory): [04. File-based routing: segments and nesting](04-routing.md).
