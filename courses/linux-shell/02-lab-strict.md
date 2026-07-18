# 02. Лаба: strict mode и trap

## Цель лабы

На практике увидеть разницу **без strict** и с **`set -euo pipefail`**, проверить **pipefail**, **nounset** и **trap cleanup** — чтобы в своих скриптах не гадать, остановится ли bash на ошибке.

## Предварительно

- [01. Strict mode](01-bash-strict.md).
- Стенд: [`deploy/linux`](../../deploy/linux/README.md).

```bash
cd deploy/linux && docker compose up -d
docker compose exec lab bash
```

---

## Подготовка стенда

```bash
bash --version | head -1
```

---

## Задание 1. Демо без strict

**Зачем:** зафиксировать «плохое» поведение по умолчанию.

```bash
cat > /tmp/no-strict.sh <<'EOF'
#!/bin/bash
false
echo "still running after false, exit code of false was masked in script: continuing"
EOF
chmod +x /tmp/no-strict.sh
/tmp/no-strict.sh
echo "script exit code: $?"
```

**Что увидите:** строка `still running...`; exit code скрипта **0** (последняя команда — echo).

---

## Задание 2. С strict

```bash
cat > /tmp/strict.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
false
echo "unreachable"
EOF
chmod +x /tmp/strict.sh
/tmp/strict.sh
echo "script exit code: $?"
```

**Что увидите:** `unreachable` **не** печатается; exit code **ненулевой**.

---

## Задание 3. nounset

```bash
bash -c 'set -u; echo "value=[$TYPO_VAR]"' 2>&1 || echo "failed as expected"
bash -c 'set -u; echo "ok with default: [${TYPO_VAR:-empty}]"'
```

---

## Задание 4. pipefail

```bash
bash -c 'set -o pipefail; false | true; echo "exit=$?"'
bash -c 'set -o pipefail; true | false; echo "exit=$?"'
bash -c 'false | true; echo "without pipefail exit=$?"'
```

**Запишите:** во втором случае с pipefail exit должен быть **ненулевым**.

---

## Задание 5. trap cleanup

```bash
cat > /tmp/trap-demo.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
TMP="/tmp/trap-demo.$$"
touch "$TMP"
cleanup() { rm -f "$TMP"; echo "cleaned $TMP"; }
trap cleanup EXIT
echo "working... file exists:"
ls -la "$TMP"
EOF
chmod +x /tmp/trap-demo.sh
/tmp/trap-demo.sh
ls /tmp/trap-demo.* 2>&1 || echo "file removed OK"
```

**Зачем:** даже при `exit 0` cleanup выполняется.

---

## Задание 6. trap ERR (опционально)

```bash
cat > /tmp/trap-err.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
trap 'echo "ERR at line $LINENO" >&2' ERR
echo start
false
EOF
chmod +x /tmp/trap-err.sh
/tmp/trap-err.sh 2>&1 || true
```

---

## Задание 7. Пример из репозитория

Из корня repo (или скопируйте скрипт в lab):

```bash
bash courses/linux-shell/examples/bin/strict-demo.sh
echo "exit=$?"
```

---

## Критерии успеха

- [ ] Объяснили себе: no-strict vs strict exit code
- [ ] pipefail изменил exit pipeline
- [ ] nounset упал на опечатке
- [ ] trap удалил `/tmp/trap-demo.*`

## Что унести в работу

- Первые строки каждого `.sh` в репо — strict header.
- В CI job падение = ненулевой exit скрипта, не только `echo` в конце.

Следующий урок: [03. Функции](03-functions.md).
