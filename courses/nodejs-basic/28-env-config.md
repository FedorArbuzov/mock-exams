# 28. Переменные окружения: dotenv и валидация

## Сценарий с работы

Junior коммитит `.env` с `DATABASE_URL` и `JWT_SECRET` в публичный репозиторий. CI падает на staging: `FASTAPI_URL` undefined — BFF шлёт запросы на `undefined/api/v1/items`. Senior: «Секреты — в vault, в git только `.env.example`. При старте приложение **обязано** упасть, если PORT или FASTAPI_URL невалидны, а не limp mode в prod».

Конфигурация через окружение — стандарт Twelve-Factor App; для BFF mock-exams критичны `PORT`, `FASTAPI_URL`, `NODE_ENV`.

## Что вы узнаете

- `process.env` в Node.js
- Пакет `dotenv` и файл `.env.example`
- Валидация PORT и FASTAPI_URL при старте
- Различие development / production / test
- Почему секреты не коммитят
- Модуль `config` как единая точка правды

---

## process.env

Node читает переменные окружения из OS и shell:

```bash
PORT=3096 FASTAPI_URL=http://localhost:8090 node src/app.js
```

```javascript
console.log(process.env.PORT);        // "3096" — всегда string или undefined
console.log(process.env.NODE_ENV);    // часто "development" | "production"
```

**Правило:** всё из `process.env` — **строки**. Числа и boolean парсите явно.

---

## dotenv — локальная разработка

```bash
npm install dotenv
```

```javascript
// src/config/loadEnv.js — импортировать ПЕРВЫМ в entry point
import dotenv from "dotenv";

dotenv.config(); // читает .env в cwd
```

```env
# .env — НЕ коммитить (добавить в .gitignore)
PORT=3096
FASTAPI_URL=http://localhost:8090
NODE_ENV=development
LOG_LEVEL=info
```

В Docker/Kubernetes env задаёт orchestrator — `dotenv` там часто не нужен.

---

## .env.example — шаблон для команды

```env
# .env.example — коммитить в git
PORT=3096
FASTAPI_URL=http://localhost:8090
NODE_ENV=development
LOG_LEVEL=info
# INTERNAL_API_KEY=change-me-in-local-only
```

README: «Скопируйте `.env.example` → `.env` и заполните».

```bash
cp .env.example .env
```

---

## Никогда не коммитить секреты

| Можно в git | Нельзя в git |
|-------------|--------------|
| `.env.example` без реальных ключей | `.env` с production secrets |
| Имена переменных | `JWT_SECRET`, API keys, passwords |
| Дефолты для local dev | Токены CI prod |

Если секрет утёк — **rotate** ключ, не только удалить commit.

`.gitignore`:

```gitignore
.env
.env.local
.env.*.local
```

---

## Валидация конфига при старте

Fail fast — лучше не стартовать, чем proxy в никуда:

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
  return url.origin; // без trailing path
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

Использование:

```javascript
import { config } from "./config/index.js";

app.listen(config.port, () => {
  console.log(`Listening ${config.port}, upstream ${config.fastapiUrl}`);
});
```

---

## PORT — типичные значения mock-exams

| Сервис | PORT | Назначение |
|--------|------|------------|
| BFF (examples) | 3096 | Express shop proxy |
| FastAPI стенд | 8090 | upstream API |
| React Vite | 5173 | браузерный клиент |

Конфликт портов — `EADDRINUSE`; меняйте `PORT` в `.env`.

---

## FASTAPI_URL — без trailing slash

```env
# ХОРОШО
FASTAPI_URL=http://localhost:8090

# ПЛОХО — двойной slash или wrong path
FASTAPI_URL=http://localhost:8090/
```

В коде:

```javascript
const url = `${config.fastapiUrl}/api/v1/items`;
```

Или `new URL('/api/v1/items', config.fastapiUrl)`.

---

## NODE_ENV и поведение

```javascript
if (config.isProd) {
  // без stack в JSON ошибок
  // stricter CORS origins
}
```

Не полагайтесь только на `NODE_ENV` для security — явные флаги лучше.

---

## Загрузка dotenv только в dev (опционально)

```javascript
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}
```

В prod env inject через platform; `.env` файла на сервере может не быть.

---

## TypeScript / Zod (справка)

В [`typescript-basic`](../typescript-basic/README.md) env валидируют через Zod:

```typescript
const EnvSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535),
  FASTAPI_URL: z.string().url(),
});
```

Идея та же: один модуль, throw at startup.

---

## Связь с Docker

```dockerfile
ENV PORT=3096
ENV FASTAPI_URL=http://fastapi:8090
```

Имена переменных **совпадают** с `.env.example` — меньше сюрпризов между local и container.

---

## Связь с курсом

- [29-lab-env.md](29-lab-env.md) — hands-on config module.
- [26-lab-express-shop.md](26-lab-express-shop.md) — FASTAPI_URL stub.
- [34-lab-bff.md](34-lab-bff.md) — proxy с валидным upstream.
- [35-project-structure.md](35-project-structure.md) — `src/config/`.
- [`deploy/fastapi`](../../deploy/fastapi/README.md) — URL `:8090`.

---

## Типичные ошибки

1. **Коммит `.env`** — incident, rotate secrets.

2. **`FASTAPI_URL` не задан** — `fetch(undefined/...)` → TypeError или 502.

3. **PORT как string в сравнениях** — `"3096" == 3096` true, но `"3096" + 1` — баг; используйте Number.

4. **dotenv после импорта config** — env ещё не загружен; порядок import matters.

5. **Разные имена в docker и .env** — `API_URL` vs `FASTAPI_URL`.

6. **Секреты в логах** — `console.log(process.env)` на prod.

7. **Дефолт FASTAPI_URL на prod** — опасно; required в production.

---

## Резюме

Конфигурация BFF живёт в `process.env`; локально подгружается через `dotenv`. В git — только `.env.example`. Модуль `src/config` парсит PORT и FASTAPI_URL и **бросает при старте**, если значения невалидны. Секреты не коммитят. Единый `config` объект импортируют routes и services — не разбросанные `process.env` по кодовой базе.

---

## Чек-лист

- Почему `.env` в `.gitignore`, а `.env.example` — нет?
- Что произойдёт, если удалить `FASTAPI_URL` из env без дефолта?
- Как безопасно собрать URL `GET items` из `FASTAPI_URL`?
- Почему PORT из env — строка и что с этим делать?
- Когда вызывать `dotenv.config()` относительно других import?
- Какие три переменные обязательны для BFF лаб?
- Чем `NODE_ENV=production` влияет на error responses?

Следующий урок: [29. Лаба: env-конфигурация](29-lab-env.md).
