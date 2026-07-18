# 01. Strict mode: set -euo pipefail

## Введение: зелёный CI, сломанный прод

Типичный сценарий: pipeline **deploy** зелёный, в логе в середине — `curl: (7) Failed to connect`, но job продолжился и дошёл до `echo "Deploy success"`. Причина: bash **не остановился** на ошибке. Миграция не применилась, кэш не сброшен, а скрипт пошёл дальше и удалил «старые» артефакты.

**Strict mode** — четыре настройки в начале файла, которые делают падение **предсказуемым**. Это стандарт для скриптов в CI/CD, Ansible hooks и cron на серверах.

## Что вы узнаете

- Флаги **`-e`**, **`-u`**, **`pipefail`** и **`IFS`**.
- **`trap`** для cleanup и сообщений об ошибках.
- Когда **намеренно** отключать `-e` (`|| true`, `set +e`).
- Шаблон заголовка production-скрипта.
- Почему shebang **`bash`**, а не **`sh`**.

---

## Базовая строка

```bash
#!/usr/bin/env bash
set -euo pipefail
```

| Флаг | Имя | Поведение |
|------|-----|-----------|
| `-e` | errexit | Выйти, если команда вернула **ненулевой** код (исключения: часть конструкций `if`, `while`, `\|\|`, `&&`) |
| `-u` | nounset | Ошибка при обращении к **необъявленной** переменной |
| `-o pipefail` | pipefail | Pipeline `a \| b` падает, если упала **любая** команда в цепочке |
| `IFS=$'\n\t'` | (часто добавляют) | Безопаснее разбор слов; пробел в пути не ломает цикл |

---

## Пример без `-e` (опасно)

```bash
#!/bin/bash
migrate_db    # упало с exit 1
echo "Migration OK"
deploy_app
echo "Deploy success"   # CI зелёный, прод сломан
```

## С `-e`

```bash
#!/usr/bin/env bash
set -euo pipefail
migrate_db
echo "Сюда не дойдём, если migrate_db упал"
```

**Exit code** всего скрипта = код первой упавшей команды — GitLab/GitHub Actions помечают job failed.

---

## nounset (`-u`)

```bash
echo "Deploy to $ENVIRNOMENT"   # опечатка → пустая строка, деплой «в никуда»
```

```bash
set -u
echo "$ENVIRNOMENT"   # bash: ENVIRNOMENT: unbound variable
```

**Практика:** обязательные переменные — `${VAR:?message}`:

```bash
HOST=${1:?usage: $0 HOST}
```

---

## pipefail

```bash
curl -sf http://bad-host/status | jq -r .status
echo "pipeline exit: $?"
```

| Режим | Exit pipeline, если curl fail |
|-------|-------------------------------|
| без pipefail | часто **0** (успех jq на пустом вводе) |
| с pipefail | **ненулевой** (ошибка curl) |

В CI цепочки `curl | jq`, `grep | wc`, `terraform plan | tee` — **всегда** `set -o pipefail`.

---

## trap — cleanup и ERR

```bash
#!/usr/bin/env bash
set -euo pipefail

TMP="$(mktemp)"
cleanup() { rm -f "$TMP"; }
trap cleanup EXIT

on_err() {
  echo "ERROR at line $LINENO: command failed (exit $?)" >&2
}
trap on_err ERR

# ... работа ...
```

| trap | Когда |
|------|--------|
| `EXIT` | при любом выходе (успех, exit, signal) |
| `ERR` | при ошибке команды (с `-e`) |

**Зачем:** временные файлы, mount, `cd` в подкаталог — не оставлять мусор.

---

## Осознанные исключения

Не оборачивайте **всё** в `|| true` — только где ошибка **ожидаема**:

```bash
# процесс может не существовать
pkill mydaemon 2>/dev/null || true

grep pattern /etc/config || true   # нет совпадения — не ошибка

set +e
optional_step
rc=$?
set -e
if [[ $rc -ne 0 ]]; then
  log WARN "optional_step failed, continuing"
fi
```

| Паттерн | Когда |
|---------|--------|
| `cmd \|\| true` | «не нашли» — норма |
| `if cmd; then` | проверка без отключения `-e` |
| `set +e` / `set -e` | блок с ручной обработкой `$?` |

---

## Shebang и shell

```bash
#!/usr/bin/env bash    # предпочтительно
```

На Ubuntu **`/bin/sh`** часто **dash** — нет `[[ ]]`, другие правила. Скрипты курса — **bash**.

---

## Шаблон начала production-скрипта

```bash
#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# readonly LOG_LEVEL="${LOG_LEVEL:-info}"
```

---

## Типичные ошибия

| Ошибка | Последствие |
|--------|-------------|
| только `-e`, без `pipefail` | тихий fail в pipeline |
| `set -u` без default для опций | падение на пустом `$2` |
| trap без кавычек в `rm -f "$TMP"` | пути с пробелами |
| `#!/bin/sh` + `[[` | скрипт не запустится |

---

## В продакшене

- Pre-commit / CI: **shellcheck** + запуск тестовых сценариев.
- Логировать **`set -x`** только в debug (`DEBUG=1`).
- В Docker `ENTRYPOINT` — тот же strict header.

---

## Резюме

**Strict mode** ловит большинство «зелёный CI, красный прод». **`pipefail`** обязателен для `|`. **`trap EXIT`** — уборка. Исключения — **осознанно**, с комментарием.

## Чек-лист

- [ ] Что сломается без `pipefail` при `curl | jq`?
- [ ] Зачем `trap cleanup EXIT`?
- [ ] Почему `|| true` — исключение, а не стиль жизни?
- [ ] Чем `#!/usr/bin/env bash` лучше `sh`?

Следующий урок: [02. Лаба: strict](02-lab-strict.md).
