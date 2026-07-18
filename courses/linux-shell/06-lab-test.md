# 06. Лаба: validate-config.sh

## Цель лабы

Написать **`validate-nginx.sh`**: **case** по ENV, проверка файла, **`nginx -t`**, сравнение **worker_processes** с минимумом через **`[[ ]]`** и **`(( ))`**.

## Предварительно

- [05. test и case](05-test-case.md).
- lab, sudo для nginx.

```bash
docker compose exec lab bash
sudo apt install -y nginx
```

---

## Подготовка стенда

```bash
nginx -v
ls -la /etc/nginx/nginx.conf
```

---

## Задание 1. Скрипт validate-nginx.sh

```bash
cat > /tmp/validate-nginx.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

CONF=/etc/nginx/nginx.conf
ENV=${1:-lab}

case "$ENV" in
  prod)  MIN_WORKERS=4 ;;
  stage) MIN_WORKERS=2 ;;
  lab|dev) MIN_WORKERS=1 ;;
  *)
    echo "Unknown env: $ENV" >&2
    exit 1
    ;;
esac

[[ -f "$CONF" ]] || { echo "Missing $CONF" >&2; exit 1; }

if sudo nginx -t 2>/dev/null; then
  echo "nginx syntax OK"
else
  echo "nginx -t failed" >&2
  exit 1
fi

workers=$(grep -E '^\s*worker_processes' "$CONF" | awk '{print $2}' | tr -d ';')
[[ -n "$workers" ]] || workers=1

if [[ "$workers" =~ ^[0-9]+$ ]] && (( workers >= MIN_WORKERS )); then
  echo "workers=$workers >= $MIN_WORKERS for $ENV"
else
  echo "workers=$workers below min $MIN_WORKERS for $ENV" >&2
  exit 1
fi
EOF
chmod +x /tmp/validate-nginx.sh
```

---

## Задание 2. Успех для lab

```bash
sudo systemctl start nginx 2>/dev/null || true
/tmp/validate-nginx.sh lab
echo "exit=$?"
```

---

## Задание 3. Неизвестный ENV

```bash
/tmp/validate-nginx.sh unknown 2>&1
echo "exit=$?"
```

**Ожидание:** `Unknown env`, exit 1.

---

## Задание 4. prod с высоким порогом

```bash
grep worker_processes /etc/nginx/nginx.conf
/tmp/validate-nginx.sh prod 2>&1 || echo "may fail if workers < 4 — expected on lab"
```

**Зачем:** увидеть, как case меняет MIN_WORKERS.

---

## Задание 5. Тест regex версии

```bash
ver="1.27.3"
[[ "$ver" =~ ^[0-9]+\.[0-9]+(\.[0-9]+)?$ ]] && echo "version format OK"
ver="v1"
[[ "$ver" =~ ^[0-9]+\.[0-9]+ ]] || echo "v1 rejected OK"
```

---

## Критерии успеха

- [ ] case отклоняет unknown ENV
- [ ] nginx -t проходит на lab
- [ ] Использованы [[ ]], (( )), regex
- [ ] Понимаете разницу MIN_WORKERS по ENV

## Что унести в работу

- Валидация конфига в CI **до** reload на сервере.
- `case` для ENV — один вход, явные ошибки.

Следующий урок: [07. getopts](07-getopts.md).
