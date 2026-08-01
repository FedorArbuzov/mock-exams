# 15. A healthcheck script for deploy

## Intro: deploy passed, the site returns 502

The pipeline is green: `kubectl rollout status` OK, but the Ingress backend is dead or nginx on the VM didn't reload. A **healthcheck** after deploy is a separate script with a **non-zero exit** that CI calls in the `verify` stage.

## What you'll learn

- Three layers of checks: **TCP**, **HTTP**, **systemd** (over SSH).
- The structure of a script with **strict mode** and functions.
- **curl** and **timeout** timeouts.
- **Retry** in GitLab CI.
- The relation to [examples/bin/healthcheck.sh](examples/bin/healthcheck.sh).

---

## The task after a deploy

| # | Check | Tool |
|---|----------|------------|
| 1 | port open | `bash /dev/tcp/HOST/PORT` |
| 2 | HTTP 200 | `curl -sf -w %{http_code}` |
| 3 | service active | `ssh ... systemctl is-active nginx` |

Any fail → **exit 1** → job failed.

---

## Script structure

```bash
#!/usr/bin/env bash
set -euo pipefail

HOST=${1:?usage: $0 HOST}
PORT=${2:-80}
PATH_URL=${3:-/}

log() { echo "[$(date -Iseconds)] $*" >&2; }

check_tcp() {
  timeout 3 bash -c "echo >/dev/tcp/$HOST/$PORT"
}

check_http() {
  local code
  code=$(curl -sf -o /dev/null -w '%{http_code}' \
    --connect-timeout 5 --max-time 10 \
    "http://${HOST}:${PORT}${PATH_URL}")
  [[ "$code" == "200" ]]
}

main() {
  log "check $HOST:$PORT$PATH_URL"
  check_tcp
  log "tcp ok"
  check_http
  log "http 200 ok"
  echo "OK"
}

main "$@"
```

---

## Example in the repository

[`examples/bin/healthcheck.sh`](examples/bin/healthcheck.sh):

```bash
bash courses/linux-shell/examples/bin/healthcheck.sh 172.28.0.20
echo "exit=$?"
```

Extend it per [lab 04](04-lab-functions.md): SSH, disk, load.

---

## Remote check

```bash
ssh -o BatchMode=yes "deploy@${HOST}" 'systemctl is-active nginx'
ssh "deploy@${HOST}" 'test -f /var/www/html/index.html'
```

---

## Timeouts

| Tool | Parameters |
|------------|-----------|
| curl | `--connect-timeout 5 --max-time 10` |
| ssh | `-o ConnectTimeout=5` |
| any command | `timeout 30 cmd` |

---

## Retry in CI

```yaml
verify:
  stage: deploy
  script:
    - |
      for i in 1 2 3 4 5; do
        ./healthcheck.sh "$HOST" && exit 0
        sleep 10
      done
      exit 1
```

Accounts for a slow rollout.

---

## Common mistakes

| Mistake | Symptom |
|--------|---------|
| curl without `-f` | a 404 counts as OK |
| checking TCP only | nginx default page / wrong vhost |
| no retry | flaky fail after deploy |
| healthcheck in the same script as deploy | exit code mixed up |

---

## In production

A separate repository or `scripts/health/` in a mono-repo. Version the thresholds (200 vs 204). Synthetic checks from the outside (blackbox exporter).

---

## Summary

**Healthcheck** — proof that "the service is alive" for CI. **exit 1** on fail. TCP + HTTP + optionally SSH/systemd.

## Checklist

- [ ] Why a separate script and not inline in YAML?
- [ ] What exit code does GitLab expect?
- [ ] Why curl `-f`?

Next lesson: [16. Final project](16-final-project.md).
