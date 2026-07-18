# 03. Лаба: CLI-скрипты и диагностика

## Зачем эта лаба

Теория [00–02](00-environment.md) дала npm, структуру `examples/` и объект `process`. **Лаба** переводит это в навыки, которые каждый день нужны в backend-командах: утилита для smoke-check FastAPI, скрипт миграции с `--dry-run`, диагностика «почему BFF не видит upstream». На Python-треке аналог — bash/python one-shot в [`linux-basic`](../linux-basic/02-lab-shell.md); здесь runtime — Node, контракт с shell — **exit codes** и сообщения в stderr.

Вы не строите HTTP-сервер — только **CLI**, но те же привычки: `cd examples`, явные ошибки, env без секретов в git. Домен **shop** появится как `SHOP_API_URL` → `http://localhost:8090` ([`deploy/fastapi`](../../deploy/fastapi/README.md)).

## Предварительно

- Node **LTS 20+**, выполнен `npm install` в `courses/nodejs-basic/examples/`.
- Прочитаны [00. Окружение](00-environment.md) и [02. process](02-process.md).
- Терминал открыт в **`examples/`**:

```bash
cd courses/nodejs-basic/examples
node --version
```

Эталоны — `examples/solutions/` — только **после** своей попытки (5–15 минут ступора).

Опционально: FastAPI на `:8090` не обязателен для всех заданий; задание 4 проверяет URL из env (можно без живого API).

---

## Задание 1. Минимальный argv: приветствие

**Контекст:** в CI первый smoke — «скрипт вообще запускается и печатает версию Node».

Создайте `lab/01-argv.js`:

```javascript
const args = process.argv.slice(2);
const name = args[0] ?? "world";

console.log(`Hello, ${name}!`);
console.log("Node:", process.version);
console.log("Args count:", args.length);
```

```bash
node lab/01-argv.js
node lab/01-argv.js ShopBot
```

**Критерий:** без аргумента — `Hello, world!`; с аргументом — имя из argv; три строки вывода без ошибок.

---

## Задание 2. Флаг `--help` и usage

**Контекст:** коллега запускает `node lab/02-cli.js` без параметров и не понимает интерфейс — нужен `--help`.

`lab/02-cli.js` должен:

1. При `--help` или `-h` печатать usage и завершаться с кодом **0**.
2. При отсутствии обязательного `--file <path>` — сообщение в **stderr**, exit **1**.
3. При `--file data.txt` — печатать `Would process: data.txt` в stdout, exit **0**.

Пример usage:

```text
Usage: node lab/02-cli.js --file <path>
       node lab/02-cli.js --help
```

**Критерий:**

```bash
node lab/02-cli.js --help          # exit 0
node lab/02-cli.js                 # stderr + exit 1
node lab/02-cli.js --file x.json   # exit 0
echo $?                            # Linux: 0; PowerShell: $LASTEXITCODE
```

---

## Задание 3. Проверка переменных окружения

**Контекст:** BFF падает в k8s с «undefined API URL» — переносим проверку в отдельный `check-env.js` для CI.

`lab/03-check-env.js`:

1. Прочитать `SHOP_API_URL` (default `http://localhost:8090`).
2. Прочитать `PORT` (default `3096`).
3. Если `NODE_ENV=production` и `SHOP_API_URL` содержит `localhost` — **предупреждение** в stderr (не exit).
4. Печатать JSON одной строкой: `{ "shopApiUrl", "port", "nodeEnv" }`.
5. Exit **0**.

Запуск:

```bash
node lab/03-check-env.js
SHOP_API_URL=http://staging/api node lab/03-check-env.js   # Git Bash / Linux
$env:SHOP_API_URL="http://staging/api"; node lab/03-check-env.js   # PowerShell
```

**Критерий:** валидный JSON в stdout; предупреждение только при production + localhost.

---

## Задание 4. Graceful сообщения и код выхода

**Контекст:** скрипт «проверка доступности API» должен различать «не задан URL» и «URL задан, но формат странный».

`lab/04-validate-url.js`:

1. Взять URL из `process.env.SHOP_API_URL`.
2. Если не задан — `ERROR: SHOP_API_URL is not set`, exit **2**.
3. Если задан, но не начинается с `http://` или `https://` — `ERROR: invalid URL scheme`, exit **1**.
4. Иначе — `OK: will check <url>`, exit **0**.

Не делайте реальный `fetch` — только валидация строки (fetch — [18-http-client.md](18-http-client.md)).

**Критерий:** три сценария с разными exit codes; сообщения об ошибках только в stderr.

---

## Задание 5. SIGINT: вежливое прерывание (опционально+)

**Контекст:** длинный цикл синхронной «работы»; пользователь жмёт Ctrl+C.

`lab/05-sigint.js`:

```javascript
let ticks = 0;
const id = setInterval(() => {
  ticks++;
  console.log("tick", ticks);
  if (ticks >= 100) clearInterval(id);
}, 200);

process.on("SIGINT", () => {
  console.log("\nInterrupted after", ticks, "ticks");
  clearInterval(id);
  process.exit(130);
});
```

Запустите, прервите Ctrl+C через несколько ticks.

**В комментарии в файле:** почему exit **130**; связь с [02-process.md](02-process.md).

---

## Критерии успеха (сводка)

- [ ] `01`–`04` запускаются из `examples/` без `Cannot find module`
- [ ] `02-cli.js`: `--help` → 0, без `--file` → 1
- [ ] `03-check-env.js`: JSON + логика production/localhost
- [ ] `04-validate-url.js`: exit codes 0 / 1 / 2 по условиям
- [ ] Понимаете, зачем stderr для ошибок, stdout для данных
- [ ] (Опционально) `05-sigint.js` и комментарий про 130

---

## Если что-то пошло не так

| Симптом | Проверка |
|---------|----------|
| `ENOENT lab/01-argv.js` | `pwd` / `cd` — вы в `examples/`? |
| Exit code всегда 0 при ошибке | Явно `process.exit(1)`; в PowerShell смотрите `$LASTEXITCODE` |
| Env не подхватывается | Windows: `$env:VAR=...` в той же сессии; Linux: одна строка `VAR=val node …` |
| JSON ломает парсер | Одна строка, двойные кавычки, `JSON.stringify` |
| `import` ошибка | В `package.json` есть `"type": "module"` |
| Кириллица в stderr «кракозябры» | UTF-8, Windows Terminal |

---

## Связь с курсом

| Следующий шаг | Зачем |
|--------------|-------|
| [04. Event loop libuv](04-event-loop-libuv.md) | почему `setInterval` в lab 05 не блокирует навсегда |
| [28-env-config.md](28-env-config.md) | dotenv и валидация Zod |
| [20-fastapi-client.md](20-fastapi-client.md) | реальный fetch к `:8090` |
| [`javascript-basic/03-lab`](../javascript-basic/03-lab-first-scripts.md) | параллель: первые скрипты без npm |

---

## Типичные ошибки

**Печатать ошибки в stdout** — ломает пайпы `node script.js | jq`. Ошибки → **stderr**.

**Забыть default для env в lab 03** — скрипт должен работать «из коробки» на ноутбуке без `.env`.

**Использовать `exit()` без завершения async** — в этих лабах async нет; позже — `await` перед exit.

**Не проверять exit code в CI** — smoke-скрипт с exit 1 должен падать job, иначе ложный green.

---

## Резюме

Лаба закрепила **argv**, **env**, **exit codes**, **stderr/stdout** и набросок **SIGINT**. Это фундамент CLI и диагностики BFF перед event loop и HTTP. Проверьте чек-лист своими словами — затем переходите к libuv.

## Чек-лист

- [ ] Все обязательные файлы lab 01–04 созданы и проверены
- [ ] Можете объяснить разницу exit 1 и exit 2 в задании 4
- [ ] Знаете, как задать env в вашей OS для одного запуска
- [ ] Usage `--help` написали сами, не скопировали без понимания

Следующий урок (теория): [04. Event loop и фазы libuv](04-event-loop-libuv.md).
