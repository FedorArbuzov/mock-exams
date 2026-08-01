# 06. Lab: validate-config.sh

## Lab goal

Write **`validate-nginx.sh`**: a **case** by ENV, a file check, **`nginx -t`**, and a comparison of **worker_processes** against a minimum via **`[[ ]]`** and **`(( ))`**.

## Prerequisites

- [05. test and case](05-test-case.md).
- lab, sudo for nginx.

```bash
docker compose exec lab bash
sudo apt install -y nginx
```

---

## Preparing the stand

```bash
nginx -v
ls -la /etc/nginx/nginx.conf
```

---

## Task 1. The validate-nginx.sh script

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

## Task 2. Success for lab

```bash
sudo systemctl start nginx 2>/dev/null || true
/tmp/validate-nginx.sh lab
echo "exit=$?"
```

---

## Task 3. Unknown ENV

```bash
/tmp/validate-nginx.sh unknown 2>&1
echo "exit=$?"
```

**Expectation:** `Unknown env`, exit 1.

---

## Task 4. prod with a high threshold

```bash
grep worker_processes /etc/nginx/nginx.conf
/tmp/validate-nginx.sh prod 2>&1 || echo "may fail if workers < 4 — expected on lab"
```

**Why:** to see how case changes MIN_WORKERS.

---

## Task 5. Version regex test

```bash
ver="1.27.3"
[[ "$ver" =~ ^[0-9]+\.[0-9]+(\.[0-9]+)?$ ]] && echo "version format OK"
ver="v1"
[[ "$ver" =~ ^[0-9]+\.[0-9]+ ]] || echo "v1 rejected OK"
```

---

## Success criteria

- [ ] case rejects an unknown ENV
- [ ] nginx -t passes on lab
- [ ] [[ ]], (( )), regex are used
- [ ] You understand the MIN_WORKERS difference by ENV

## What to take into your work

- Config validation in CI **before** the reload on the server.
- `case` for ENV — a single entry point, explicit errors.

Next lesson: [07. getopts](07-getopts.md).
