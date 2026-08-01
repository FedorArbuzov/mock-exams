# 29. Lab: env configuration

## A scenario from work

DevOps added a CI check: “BFF must not start without a valid `FASTAPI_URL`.” Your job — move all magic strings out of `app.js` into a `src/config` module, add `.env.example`, make sure the app **fails with a clear message** on a bad PORT, and **works** with a correct `.env`. Code review tomorrow.

This lab cements [28-env-config.md](28-env-config.md) on the project from [26-lab-express-shop.md](26-lab-express-shop.md).

## Goals

- Create `src/config/index.js` with validation
- Add `.env.example` and update `.gitignore`
- Wire config into `app.js` and `upstream.js`
- Verify fail-fast and happy path
- Document variables in the examples README

**Time:** ~40–50 minutes.

---

## Step 0. Preparation

```bash
cd courses/nodejs-basic/examples
npm install dotenv
```

Make sure `.gitignore` contains `.env`.

---

## Step 1. .env.example

Create the file at the root of `examples/`:

```env
# Server
PORT=3096
NODE_ENV=development

# Upstream FastAPI shop API
FASTAPI_URL=http://localhost:8090

# Logging (lesson 30)
LOG_LEVEL=info

# Optional: internal routes (stub)
# INTERNAL_API_KEY=dev-only-key
```

Copy locally:

```bash
cp .env.example .env
```

---

## Step 2. Config module

```javascript
// src/config/index.js
import dotenv from "dotenv";

dotenv.config();

function required(name) {
  const v = process.env[name];
  if (v == null || String(v).trim() === "") {
    throw new Error(`[config] Missing required env: ${name}`);
  }
  return String(v).trim();
}

function parsePort(value, fallback) {
  const raw = value ?? fallback;
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`[config] Invalid PORT: ${raw}`);
  }
  return port;
}

function parseHttpOrigin(name, raw) {
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`[config] Invalid ${name}: ${raw}`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`[config] ${name} must be http(s): ${raw}`);
  }
  return parsed.origin;
}

export const config = Object.freeze({
  port: parsePort(process.env.PORT, "3096"),
  fastapiUrl: parseHttpOrigin("FASTAPI_URL", required("FASTAPI_URL")),
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProd: (process.env.NODE_ENV ?? "development") === "production",
  logLevel: process.env.LOG_LEVEL ?? "info",
  internalApiKey: process.env.INTERNAL_API_KEY ?? null,
});
```

`Object.freeze` — don't accidentally mutate config at runtime.

---

## Step 3. Update upstream

```javascript
// src/config/upstream.js
import { config } from "./index.js";

export const FASTAPI_URL = config.fastapiUrl;

export function itemsUrl(path = "") {
  return new URL(`/api/v1/items${path}`, FASTAPI_URL).toString();
}

export function proxyLog(method, path) {
  console.log(`[proxy-stub] would ${method} ${FASTAPI_URL}${path}`);
}
```

---

## Step 4. app.js uses config

```javascript
// src/app.js — fragment
import { config } from "./config/index.js";

// ... middleware, routes ...

app.listen(config.port, () => {
  console.log(`Shop BFF http://localhost:${config.port}`);
  console.log(`Upstream ${config.fastapiUrl} (NODE_ENV=${config.nodeEnv})`);
});
```

Remove all `process.env.PORT ?? 3096` from other files.

---

## Step 5. Fail-fast test

### 5.1 Invalid PORT

```bash
PORT=99999 FASTAPI_URL=http://localhost:8090 node src/app.js
```

Expected: process exits with `[config] Invalid PORT: 99999`.

### 5.2 Missing FASTAPI_URL

```bash
# Windows PowerShell — temporarily clear the variable
$env:FASTAPI_URL=$null; node src/app.js
```

Or rename `.env` for a minute:

```bash
mv .env .env.bak
node src/app.js   # Missing required env: FASTAPI_URL
mv .env.bak .env
```

### 5.3 Broken URL

```env
FASTAPI_URL=not-a-url
```

Expected: `[config] Invalid FASTAPI_URL`.

---

## Step 6. Happy path

```bash
npm run dev
curl -s http://localhost:3096/health | jq
curl -s http://localhost:3096/api/v1/items | jq
```

In stdout on startup:

```text
Shop BFF http://localhost:3096
Upstream http://localhost:8090 (NODE_ENV=development)
```

---

## Step 7. README fragment

Add to `examples/README.md` (or a comment in `.env.example`):

```markdown
## Environment

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | no | 3096 | BFF listen port |
| FASTAPI_URL | yes | — | FastAPI base URL (:8090) |
| NODE_ENV | no | development | Runtime mode |
| LOG_LEVEL | no | info | Pino level (lab 31) |
```

---

## Step 8. (Optional) validate-only script

```javascript
// scripts/validate-config.mjs
import "../src/config/index.js";
console.log("Config OK");
```

```json
"scripts": {
  "config:check": "node scripts/validate-config.mjs"
}
```

CI can run `npm run config:check` without starting the server.

---

## Success criteria

- [ ] `.env` in `.gitignore`, `.env.example` in git
- [ ] No direct `process.env.FASTAPI_URL` in routes/services
- [ ] Invalid/missing env → clear throw before `listen`
- [ ] `npm run dev` + curl work with `.env`
- [ ] `itemsUrl('/1')` yields `http://localhost:8090/api/v1/items/1`

---

## If something went wrong

| Symptom | Solution |
|---------|---------|
| FASTAPI missing despite `.env` | cwd is not `examples/`; dotenv looks for .env in cwd |
| Double dotenv.config | once in config/index.js |
| Windows env syntax | use the `.env` file, not inline export |
| config OK but wrong port | second `.env` or shell PORT overrides |

---

## Related courses

- [30-logging-pino.md](30-logging-pino.md) — `LOG_LEVEL` from config.
- [34-lab-bff.md](34-lab-bff.md) — real fetch to `config.fastapiUrl`.
- [35-project-structure.md](35-project-structure.md) — where config sits in the tree.

---

## Common mistakes

1. Importing routes **before** dotenv — config reads empty env.

2. Committing `.env` “by accident” — check `git status`.

3. `FASTAPI_URL` with path `/api` — duplication when joining URLs.

4. Secret `INTERNAL_API_KEY` in `.env.example` with a real value.

5. Validation only in app.js, not in the config module — routes import upstream earlier.

---

## Summary

The lab moves PORT, FASTAPI_URL, and related variables into `src/config/index.js` with fail-fast validation. `.env.example` documents the contract; `.env` stays local. All code imports `config`, not `process.env`. Verify with intentionally broken env and a working `npm run dev`.

---

## Checklist

- Where is the single `dotenv.config()` call?
- Which env variable is required with no default?
- How do you check an invalid PORT with one command?
- Why `Object.freeze(config)`?
- How do you build an item-by-id URL via `itemsUrl`?
- What to add to `.gitignore`?
- How can CI check config without listen?

Next lesson: [30. Structured logs: pino](30-logging-pino.md).
