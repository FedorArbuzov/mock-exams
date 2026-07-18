# 29. Лаба: env-конфигурация

## Сценарий с работы

DevOps добавил в CI проверку: «BFF не стартует без валидного `FASTAPI_URL`». Ваша задача — вынести все magic strings из `app.js` в модуль `src/config`, добавить `.env.example`, убедиться что приложение **падает с понятным сообщением** при битом PORT, и **работает** при корректном `.env`. Code review завтра.

Лаба закрепляет [28-env-config.md](28-env-config.md) на проекте из [26-lab-express-shop.md](26-lab-express-shop.md).

## Цели

- Создать `src/config/index.js` с валидацией
- Добавить `.env.example` и обновить `.gitignore`
- Подключить config в `app.js` и `upstream.js`
- Проверить fail-fast и happy path
- Документировать переменные в README examples

**Время:** ~40–50 минут.

---

## Шаг 0. Подготовка

```bash
cd courses/nodejs-basic/examples
npm install dotenv
```

Убедитесь, что `.gitignore` содержит `.env`.

---

## Шаг 1. .env.example

Создайте файл в корне `examples/`:

```env
# Server
PORT=3096
NODE_ENV=development

# Upstream FastAPI shop API
FASTAPI_URL=http://localhost:8090

# Logging (урок 30)
LOG_LEVEL=info

# Optional: internal routes (stub)
# INTERNAL_API_KEY=dev-only-key
```

Скопируйте локально:

```bash
cp .env.example .env
```

---

## Шаг 2. Модуль config

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

`Object.freeze` — случайно не мутировать config в runtime.

---

## Шаг 3. Обновить upstream

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

## Шаг 4. app.js использует config

```javascript
// src/app.js — фрагмент
import { config } from "./config/index.js";

// ... middleware, routes ...

app.listen(config.port, () => {
  console.log(`Shop BFF http://localhost:${config.port}`);
  console.log(`Upstream ${config.fastapiUrl} (NODE_ENV=${config.nodeEnv})`);
});
```

Удалите все `process.env.PORT ?? 3096` из других файлов.

---

## Шаг 5. Тест fail-fast

### 5.1 Невалидный PORT

```bash
PORT=99999 FASTAPI_URL=http://localhost:8090 node src/app.js
```

Ожидание: процесс завершается с `[config] Invalid PORT: 99999`.

### 5.2 Отсутствует FASTAPI_URL

```bash
# Windows PowerShell — временно убрать переменную
$env:FASTAPI_URL=$null; node src/app.js
```

Или переименуйте `.env` на минуту:

```bash
mv .env .env.bak
node src/app.js   # Missing required env: FASTAPI_URL
mv .env.bak .env
```

### 5.3 Битый URL

```env
FASTAPI_URL=not-a-url
```

Ожидание: `[config] Invalid FASTAPI_URL`.

---

## Шаг 6. Happy path

```bash
npm run dev
curl -s http://localhost:3096/health | jq
curl -s http://localhost:3096/api/v1/items | jq
```

В stdout при старте:

```text
Shop BFF http://localhost:3096
Upstream http://localhost:8090 (NODE_ENV=development)
```

---

## Шаг 7. README фрагмент

Добавьте в `examples/README.md` (или комментарий в `.env.example`):

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

## Шаг 8. (Опционально) validate-only script

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

CI может запускать `npm run config:check` без поднятия сервера.

---

## Критерии успеха

- [ ] `.env` в `.gitignore`, `.env.example` в git
- [ ] Нет прямого `process.env.FASTAPI_URL` в routes/services
- [ ] Invalid/missing env → понятный throw до `listen`
- [ ] `npm run dev` + curl работают с `.env`
- [ ] `itemsUrl('/1')` даёт `http://localhost:8090/api/v1/items/1`

---

## Если что-то пошло не так

| Симптом | Решение |
|---------|---------|
| FASTAPI missing при наличии `.env` | cwd не `examples/`; dotenv ищет .env в cwd |
| Двойной dotenv.config | один раз в config/index.js |
| Windows env syntax | используйте `.env` файл, не inline export |
| config OK но wrong port | второй `.env` или shell PORT перекрывает |

---

## Связь с курсом

- [30-logging-pino.md](30-logging-pino.md) — `LOG_LEVEL` из config.
- [34-lab-bff.md](34-lab-bff.md) — реальный fetch на `config.fastapiUrl`.
- [35-project-structure.md](35-project-structure.md) — место config в дереве.

---

## Типичные ошибки

1. Импорт routes **до** dotenv — config читает пустой env.

2. Коммит `.env` «случайно» — проверьте `git status`.

3. `FASTAPI_URL` с path `/api` — дублирование в join URL.

4. Секрет `INTERNAL_API_KEY` в `.env.example` с реальным значением.

5. Валидация только в app.js, не в config module — routes импортируют upstream раньше.

---

## Резюме

Лаба выносит PORT, FASTAPI_URL и смежные переменные в `src/config/index.js` с fail-fast валидацией. `.env.example` документирует контракт; `.env` остаётся локальным. Весь код импортирует `config`, а не `process.env`. Проверка: намеренно сломанные env и рабочий `npm run dev`.

---

## Чек-лист

- Где единственное место вызова `dotenv.config()`?
- Какая env переменная required без дефолта?
- Как проверить invalid PORT одной командой?
- Зачем `Object.freeze(config)`?
- Как собрать URL item by id через `itemsUrl`?
- Что добавить в `.gitignore`?
- Как CI может проверить config без listen?

Следующий урок: [30. Структурированные логи: pino](30-logging-pino.md).
