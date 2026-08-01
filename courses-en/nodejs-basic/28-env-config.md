# 28. Environment variables: dotenv and validation

## A scenario from work

A junior commits `.env` with `DATABASE_URL` and `JWT_SECRET` into a public repo. CI fails on staging: `FASTAPI_URL` is undefined, so the BFF sends requests to `undefined/api/v1/items`. The senior engineer: "Secrets go in the vault; only `.env.example` goes in git. On startup the app **must** crash if PORT or FASTAPI_URL are invalid — no limping along in prod."

Configuring an app through the environment is the standard set out by the Twelve-Factor App; for the mock-exams BFF, `PORT`, `FASTAPI_URL`, and `NODE_ENV` are the critical ones.

## What you'll learn

- `process.env` in Node.js
- The `dotenv` package and the `.env.example` file
- Validating PORT and FASTAPI_URL at startup
- The difference between development / production / test
- Why secrets don't get committed
- The `config` module as a single source of truth

---

## process.env

Node reads environment variables from the OS and shell:

```bash
PORT=3096 FASTAPI_URL=http://localhost:8090 node src/app.js
```

```javascript
console.log(process.env.PORT);        // "3096" — always a string or undefined
console.log(process.env.NODE_ENV);    // often "development" | "production"
```

**Rule:** everything coming out of `process.env` is a **string**. Parse numbers and booleans explicitly.

---

## dotenv — local development

```bash
npm install dotenv
```

```javascript
// src/config/loadEnv.js — import this FIRST in the entry point
import dotenv from "dotenv";

dotenv.config(); // reads .env from cwd
```

```env
# .env — do NOT commit (add to .gitignore)
PORT=3096
FASTAPI_URL=http://localhost:8090
NODE_ENV=development
LOG_LEVEL=info
```

In Docker/Kubernetes the orchestrator sets the env — `dotenv` is often unnecessary there.

---

## .env.example — a template for the team

```env
# .env.example — commit this to git
PORT=3096
FASTAPI_URL=http://localhost:8090
NODE_ENV=development
LOG_LEVEL=info
# INTERNAL_API_KEY=change-me-in-local-only
```

README: "Copy `.env.example` to `.env` and fill it in."

```bash
cp .env.example .env
```

---

## Never commit secrets

| OK in git | Not OK in git |
|-------------|--------------|
| `.env.example` with no real keys | `.env` with production secrets |
| Variable names | `JWT_SECRET`, API keys, passwords |
| Defaults for local dev | Prod CI tokens |

If a secret leaks, **rotate** the key — deleting the commit isn't enough.

`.gitignore`:

```gitignore
.env
.env.local
.env.*.local
```

---

## Validating config at startup

Fail fast — better not to start at all than to proxy into the void:

```javascript
// src/config/index.js
import dotenv from "dotenv";

dotenv.config();

function required(name) {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") {
    throw new Error(`Missing required env: ${name}`);
  }
  return value.trim();
}

function parsePort(raw) {
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT: ${raw}`);
  }
  return port;
}

function parseUrl(name, raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`Invalid ${name}: not a URL (${raw})`);
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error(`Invalid ${name}: protocol must be http(s)`);
  }
  return url.origin; // without trailing path
}

const PORT = parsePort(process.env.PORT ?? "3096");
const FASTAPI_URL = parseUrl("FASTAPI_URL", required("FASTAPI_URL"));
const NODE_ENV = process.env.NODE_ENV ?? "development";
const LOG_LEVEL = process.env.LOG_LEVEL ?? "info";

export const config = {
  port: PORT,
  fastapiUrl: FASTAPI_URL,
  nodeEnv: NODE_ENV,
  isProd: NODE_ENV === "production",
  logLevel: LOG_LEVEL,
};
```

Usage:

```javascript
import { config } from "./config/index.js";

app.listen(config.port, () => {
  console.log(`Listening ${config.port}, upstream ${config.fastapiUrl}`);
});
```

---

## PORT — typical mock-exams values

| Service | PORT | Purpose |
|--------|------|------------|
| BFF (examples) | 3096 | Express shop proxy |
| FastAPI stand | 8090 | upstream API |
| React Vite | 5173 | browser client |

Port conflicts throw `EADDRINUSE` — change `PORT` in `.env`.

---

## FASTAPI_URL — no trailing slash

```env
# GOOD
FASTAPI_URL=http://localhost:8090

# BAD — double slash or wrong path
FASTAPI_URL=http://localhost:8090/
```

In code:

```javascript
const url = `${config.fastapiUrl}/api/v1/items`;
```

Or `new URL('/api/v1/items', config.fastapiUrl)`.

---

## NODE_ENV and behavior

```javascript
if (config.isProd) {
  // no stack trace in JSON error bodies
  // stricter CORS origins
}
```

Don't rely on `NODE_ENV` alone for security — explicit flags are better.

---

## Loading dotenv only in dev (optional)

```javascript
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}
```

In prod, the env is injected by the platform; there may be no `.env` file on the server at all.

---

## TypeScript / Zod (reference)

In [`typescript-basic`](../typescript-basic/README.md) the env is validated with Zod:

```typescript
const EnvSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535),
  FASTAPI_URL: z.string().url(),
});
```

Same idea: one module, throw at startup.

---

## Relation to Docker

```dockerfile
ENV PORT=3096
ENV FASTAPI_URL=http://fastapi:8090
```

The variable names **match** `.env.example` — fewer surprises between local and container.

---

## Ties to the course

- [29-lab-env.md](29-lab-env.md) — hands-on config module.
- [26-lab-express-shop.md](26-lab-express-shop.md) — FASTAPI_URL stub.
- [34-lab-bff.md](34-lab-bff.md) — proxy with a valid upstream.
- [35-project-structure.md](35-project-structure.md) — `src/config/`.
- [`deploy/fastapi`](../../deploy/fastapi/README.md) — the `:8090` URL.

---

## Common mistakes

1. **Committing `.env`** — an incident; rotate the secrets.

2. **`FASTAPI_URL` not set** — `fetch(undefined/...)` → a TypeError or a 502.

3. **Treating PORT as a string in comparisons** — `"3096" == 3096` is true, but `"3096" + 1` is a bug; use Number.

4. **Calling dotenv after config is imported** — the env isn't loaded yet; import order matters.

5. **Different names in docker and .env** — `API_URL` vs `FASTAPI_URL`.

6. **Secrets in logs** — `console.log(process.env)` in prod.

7. **A default FASTAPI_URL in prod** — dangerous; make it required in production.

---

## Summary

BFF configuration lives in `process.env`; locally it's loaded via `dotenv`. Only `.env.example` goes into git. The `src/config` module parses PORT and FASTAPI_URL and **throws at startup** if the values are invalid. Secrets are never committed. Routes and services import a single `config` object — not `process.env` scattered across the codebase.

---

## Checklist

- Why is `.env` in `.gitignore` but `.env.example` isn't?
- What happens if you remove `FASTAPI_URL` from the env with no default?
- How do you safely build the `GET items` URL from `FASTAPI_URL`?
- Why is PORT from env a string, and what do you do about it?
- When should `dotenv.config()` be called relative to other imports?
- Which three variables are required for the BFF lab?
- How does `NODE_ENV=production` affect error responses?

Next lesson: [29. Lab: env configuration](29-lab-env.md).
