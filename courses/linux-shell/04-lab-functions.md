# 04. Лаба: функции logging и healthcheck

## Цель лабы

Написать скрипт **`host-check.sh`** с функциями **log**, **check_ssh**, **check_http** и **main** — мини-healthcheck для web/srv на стенде. Закрепить **local**, exit codes и логи в stderr.

## Предварительно

- [03. Функции](03-functions.md).
- lab, `curl`, доступ к `172.28.0.20` (web).

```bash
docker compose exec lab bash
```

---

## Подготовка стенда

```bash
ping -c1 172.28.0.20
```

На web (опционально):

```bash
ssh course@172.28.0.20 'sudo apt install -y nginx && sudo systemctl start nginx'
```

---

## Задание 1. Создать скрипт

Создайте `/tmp/host-check.sh`:

```bash
cat > /tmp/host-check.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

log() {
  local level=$1
  shift
  echo "[$(date -Iseconds)] [$level] $*" >&2
}

check_http() {
  local url=$1
  local code
  code=$(curl -sf -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || echo "000")
  [[ "$code" == "200" ]]
}

check_ssh() {
  local host=$1
  timeout 3 bash -c "echo >/dev/tcp/$host/22" 2>/dev/null
}

main() {
  local host=${1:-172.28.0.20}
  log INFO "checking $host"
  if check_ssh "$host"; then
    log INFO "port 22 open"
  else
    log WARN "port 22 closed or filtered"
  fi
  if check_http "http://${host}/"; then
    log INFO "HTTP 200"
  else
    log ERROR "HTTP failed"
    return 1
  fi
  log INFO "all checks passed"
}

main "$@"
EOF
chmod +x /tmp/host-check.sh
shellcheck /tmp/host-check.sh 2>/dev/null || true
```

---

## Задание 2. Успешная проверка

```bash
/tmp/host-check.sh 172.28.0.20
echo "exit=$?"
```

**Что увидите:** INFO-строки в stderr, `exit=0`.

---

## Задание 3. Негативный тест

```bash
/tmp/host-check.sh 172.28.0.99 2>&1 || echo "exit=$?"
```

**Ожидание:** ERROR HTTP, ненулевой exit.

---

## Задание 4. Демо global vs local

```bash
bash -c '
f() { x=inner; }
x=outer
f
echo "without local: x=$x"
'
bash -c '
f() { local x=inner; }
x=outer
f
echo "with local: x=$x"
'
```

---

## Задание 5. Сравнение с examples

```bash
bash courses/linux-shell/examples/bin/healthcheck.sh 172.28.0.20 2>/dev/null || \
  bash /path/to/healthcheck.sh 172.28.0.20
```

---

## Критерии успеха

- [ ] Скрипт с log, check_http, check_ssh, main
- [ ] HTTP 200 на web при запущенном nginx
- [ ] Негативный хост даёт exit ≠ 0
- [ ] Понимаете local vs global

## Что унести в работу

- Healthcheck = функции + ненулевой exit → CI fail.
- Логи — в **stderr**, результат — exit code / stdout.

Следующий урок: [05. test и [[ ]]](05-test-case.md).
