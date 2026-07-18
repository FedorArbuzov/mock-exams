# 02. Объект `process`: argv, env, exit codes, signals

## Введение: сценарий с работы

Ночной деплой. Cron запускает `node scripts/sync-inventory.js --dry-run`, но скрипт молча завершается с кодом **1** — мониторинг шлёт алерт. В логах CI: «`DATABASE_URL` is undefined» — переменная есть в `.env` локально, но не проброшена в GitLab job. Разработчик жмёт Ctrl+C в терминале, где крутится миграция — процесс обрывается посередине транзакции. Ещё один инцидент: необработанное исключение в async-колбэке «убило» весь BFF, потому что не было `uncaughtException` handler и PM2 перезапустил инстанс.

Объект **`process`** — мост между JavaScript и операционной системой. На [`javascript-basic/00-environment`](../javascript-basic/00-environment.md) вы уже видели `process.version` и `process.platform`. В nodejs-basic это **инструмент production**: аргументы CLI, секреты из env, коды выхода для shell, graceful shutdown по SIGTERM от Kubernetes.

## Что вы узнаете

- **`process.argv`** — как читать аргументы командной строки.
- **`process.env`** — конфигурация без хардкода; связь с `.env` и FastAPI settings.
- **`process.exit(code)`** — контракт с shell и CI.
- **SIGINT / SIGTERM** — корректное завершение сервера и скриптов.
- **`uncaughtException` / `unhandledRejection`** — обзор, без злоупотребления.
- Практики для CLI-лаб и будущего BFF.

---

## process.argv: аргументы командной строки

Когда вы пишете:

```bash
node lab/check-env.js --port 3096 --verbose
```

Node передаёт массив строк:

```javascript
// lab/check-env.js
console.log(process.argv);

// Пример вывода:
// [
//   'C:\\Program Files\\nodejs\\node.exe',  // или /usr/bin/node
//   'C:\\...\\lab\\check-env.js',
//   '--port',
//   '3096',
//   '--verbose'
// ]
```

| Индекс | Содержимое |
|--------|------------|
| `0` | путь к исполняемому `node` |
| `1` | путь к запускаемому `.js` файлу |
| `2+` | аргументы пользователя |

Парсинг вручную (лаба [03-lab-cli.md](03-lab-cli.md)):

```javascript
const args = process.argv.slice(2);

function getFlag(name) {
  const i = args.indexOf(name);
  if (i === -1) return undefined;
  return args[i + 1];
}

const port = getFlag("--port") ?? "3096";
const verbose = args.includes("--verbose");

if (verbose) {
  console.log(`Starting with port=${port}`);
}
```

Для сложных CLI позже используют **commander** или **yargs** — в basic достаточно `slice(2)` и явных проверок. Аналог в Python: `sys.argv` в [`linux-basic`](../linux-basic/README.md) скриптах.

---

## process.env: конфигурация окружения

**Переменные окружения** — способ передать настройки без изменения кода:

```javascript
const apiBase = process.env.SHOP_API_URL ?? "http://localhost:8090";
const nodeEnv = process.env.NODE_ENV ?? "development";

console.log({ apiBase, nodeEnv });
```

| Переменная (пример) | Назначение |
|---------------------|------------|
| `NODE_ENV` | `development` / `production` — режим логов, кэш |
| `PORT` | порт BFF (3096) |
| `SHOP_API_URL` | upstream FastAPI `http://localhost:8090` |
| `LOG_LEVEL` | `info`, `debug` для pino |

Локально копируют `.env.example` → `.env`; пакет **dotenv** загружает файл в `process.env` ([28-env-config.md](28-env-config.md)). **Никогда** не коммитьте `.env` с секретами — как `.env` в Python FastAPI.

```javascript
// Проверка обязательной переменной — fail fast
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("ERROR: DATABASE_URL is not set");
  process.exit(1);
}
```

Связь с shop: BFF читает `SHOP_API_URL` и проксирует на [`deploy/fastapi`](../../deploy/fastapi/README.md).

---

## Exit codes: язык shell и CI

Когда процесс завершается, shell получает **код выхода** (0 = успех, ненулевой = ошибка):

```javascript
function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node validate.js <path>");
    process.exit(1);
  }
  // … validation OK
  process.exit(0);
}

main();
```

| Код | Значение (Unix tradition) |
|-----|---------------------------|
| `0` | успех |
| `1` | общая ошибка |
| `2` | misuse (неверные аргументы) |
| `130` | прервано SIGINT (128 + 2) |

В GitLab CI из [`gitlab-basic`](../gitlab-basic/README.md):

```yaml
script:
  - node scripts/smoke.js
```

Если `smoke.js` вызовет `process.exit(1)`, job **failed** — без try/catch в YAML. Явные exit codes — часть контракта CLI-утилит, как `pytest` exit code в Python-треке.

**Замечание:** `process.exit()` **немедленно** завершает процесс; pending async I/O и `console.log` в очереди могут не успеть. Для сервера — graceful shutdown (ниже).

---

## Signals: SIGINT и SIGTERM

ОС и orchestrator (Docker, Kubernetes) посылают **сигналы** процессу:

| Сигнал | Когда | Типичная реакция Node |
|--------|-------|------------------------|
| **SIGINT** | Ctrl+C в терминале | завершить |
| **SIGTERM** | `docker stop`, k8s terminate | graceful shutdown |
| **SIGHUP** | перезагрузка terminal / reload config | перечитать config (редко) |

```javascript
let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}, closing…`);

  // Закрыть server.close(), flush logs, disconnect DB — в nodejs-intermediate
  setTimeout(() => {
    console.log("Bye");
    process.exit(0);
  }, 500);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
```

Kubernetes даёт **grace period** (например 30 s): за это время BFF должен перестать принимать новые запросы и дождаться текущих. Тема [`nodejs-advanced`](../javascript-path.md). Пока — понимать, **почему** нельзя просто `process.exit(0)` на SIGTERM без закрытия listen socket.

---

## uncaughtException и unhandledRejection (обзор)

Если исключение **не поймано** в синхронном коде:

```javascript
throw new Error("sync boom");
// → uncaughtException
```

Node по умолчанию печатает stack и **завершает процесс** (поведение менялось между версиями — проверяйте LTS docs).

Для **Promise** без `.catch()`:

```javascript
Promise.reject(new Error("async boom"));
// → unhandledRejection (предупреждение / exit в зависимости от флагов)
```

Обработчики (использовать осознанно, не «глотать» все ошибки):

```javascript
process.on("uncaughtException", (err) => {
  console.error("FATAL uncaughtException:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("FATAL unhandledRejection:", reason);
  process.exit(1);
});
```

В Express **async route** без try/catch — классический источник unhandledRejection ([24-express-errors.md](24-express-errors.md)). Правильнее ловить на уровне handler, а не полагаться только на process-level.

**Антипаттерн:** продолжать работу после `uncaughtException` — состояние процесса может быть повреждено. Обычно log + exit + restart через PM2/k8s.

---

## process.pid, cwd, stdin/stdout

Полезные поля для диагностики:

```javascript
console.log({
  pid: process.pid,
  cwd: process.cwd(),
  version: process.version,
  platform: process.platform,
});
```

| Свойство | Зачем |
|----------|-------|
| `process.pid` | `kill`, логи, APM |
| `process.cwd()` | текущая рабочая директория shell — см. [00-environment](00-environment.md) |
| `process.stdin` / `stdout` / `stderr` | пайпы, CLI ([14-lab-streams.md](14-lab-streams.md)) |

---

## Связь с mock-exams

| Компонент | Использование process |
|-----------|------------------------|
| CLI sync к catalog | `argv`, exit 1 при ошибке |
| BFF `npm run dev` | `PORT`, `SHOP_API_URL` |
| Docker deploy | SIGTERM, `NODE_ENV=production` |
| CI smoke | exit 0 только если `:8090/health` OK |

Сравнение с Python: `os.environ`, `sys.exit()` в FastAPI scripts — тот же слой абстракции.

---

## Типичные ошибки

**Хардкод `http://localhost:8090` в коде.** На staging другой URL — только через `process.env`.

**Игнорировать exit code.** Скрипт падает с exception, shell видит 0 — если не вызван `process.exit(1)` в catch. Оберните `main()` в try/catch.

**Ctrl+C во время записи файла.** Без SIGINT handler — обрыв; используйте graceful или транзакции ([11-lab-fs.md](11-lab-fs.md)).

**`.env` есть, но `process.env` пуст.** Забыли `import 'dotenv/config'` или не export в CI — переменные только в файле, не в окружении job.

**Ловить uncaughtException и «продолжать как ни в чём не бывало».** Риск corrupted state; стандарт — exit + restart.

**Путать `argv[0]` с именем скрипта.** Пользовательские аргументы — с индекса 2.

---

## Резюме

`process` связывает Node с OS и DevOps: **argv** для CLI, **env** для конфигурации shop BFF и FastAPI URL, **exit codes** для CI, **signals** для graceful shutdown. Ошибки на уровне process (`uncaughtException`, `unhandledRejection`) — последняя линия обороны; в прикладном коде предпочитайте явный try/catch и error middleware. Следующая лаба закрепит argv и env на практике.

## Чек-лист

- [ ] Объясните структуру `process.argv` и зачем `slice(2)`
- [ ] Приведите три переменные env для BFF shop
- [ ] Какой exit code ожидает успешный шаг CI?
- [ ] Разница SIGINT и SIGTERM в production
- [ ] Почему unhandled rejection в async route опасен для BFF
- [ ] Знаете, где в mock-exams задаётся URL FastAPI (`8090`)

Следующий урок: [03. Лаба: CLI-скрипты](03-lab-cli.md).
