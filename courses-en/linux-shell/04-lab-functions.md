# 04. Lab: logging and healthcheck functions

## Lab goal

Write a **`host-check.sh`** script with the functions **log**, **check_ssh**, **check_http** and **main** — a mini healthcheck for web/srv on the stand. Reinforce **local**, exit codes and logs to stderr.

## Prerequisites

- [03. Functions](03-functions.md).
- lab, `curl`, access to `172.28.0.20` (web).

```bash
docker compose exec lab bash
```

---

## Preparing the stand

```bash
ping -c1 172.28.0.20
```

On web (optional):

```bash
ssh course@172.28.0.20 'sudo apt install -y nginx && sudo systemctl start nginx'
```

---

## Task 1. Create the script

Create `/tmp/host-check.sh`:

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

## Task 2. Successful check

```bash
/tmp/host-check.sh 172.28.0.20
echo "exit=$?"
```

**What you'll see:** INFO lines in stderr, `exit=0`.

---

## Task 3. Negative test

```bash
/tmp/host-check.sh 172.28.0.99 2>&1 || echo "exit=$?"
```

**Expectation:** ERROR HTTP, non-zero exit.

---

## Task 4. Demo global vs local

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

## Task 5. Compare with examples

```bash
bash courses/linux-shell/examples/bin/healthcheck.sh 172.28.0.20 2>/dev/null || \
  bash /path/to/healthcheck.sh 172.28.0.20
```

---

## Success criteria

- [ ] A script with log, check_http, check_ssh, main
- [ ] HTTP 200 on web when nginx is running
- [ ] A negative host gives exit ≠ 0
- [ ] You understand local vs global

## What to take into your work

- Healthcheck = functions + non-zero exit → CI fail.
- Logs go to **stderr**, the result is the exit code / stdout.

Next lesson: [05. test and [[ ]]](05-test-case.md).
