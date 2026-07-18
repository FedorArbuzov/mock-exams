# 15. Healthcheck-скрипт для deploy

## Введение: deploy прошёл, сайт 502

Pipeline зелёный: `kubectl rollout status` OK, но Ingress бэкенд мёртв или nginx на VM не перезагрузился. **Healthcheck** после deploy — отдельный скрипт с **ненулевым exit**, который CI вызывает в stage `verify`.

## Что вы узнаете

- Три слоя проверки: **TCP**, **HTTP**, **systemd** (по SSH).
- Структура скрипта с **strict mode** и функциями.
- Таймауты **curl** и **timeout**.
- **Retry** в GitLab CI.
- Связь с [examples/bin/healthcheck.sh](examples/bin/healthcheck.sh).

---

## Задача после деплоя

| # | Проверка | Инструмент |
|---|----------|------------|
| 1 | порт открыт | `bash /dev/tcp/HOST/PORT` |
| 2 | HTTP 200 | `curl -sf -w %{http_code}` |
| 3 | сервис active | `ssh ... systemctl is-active nginx` |

Любой fail → **exit 1** → job failed.

---

## Структура скрипта

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

## Пример в репозитории

[`examples/bin/healthcheck.sh`](examples/bin/healthcheck.sh):

```bash
bash courses/linux-shell/examples/bin/healthcheck.sh 172.28.0.20
echo "exit=$?"
```

Расширьте по [лабе 04](04-lab-functions.md): SSH, disk, load.

---

## Удалённая проверка

```bash
ssh -o BatchMode=yes "deploy@${HOST}" 'systemctl is-active nginx'
ssh "deploy@${HOST}" 'test -f /var/www/html/index.html'
```

---

## Таймауты

| Инструмент | Параметры |
|------------|-----------|
| curl | `--connect-timeout 5 --max-time 10` |
| ssh | `-o ConnectTimeout=5` |
| любая команда | `timeout 30 cmd` |

---

## Retry в CI

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

Учитывает медленный rollout.

---

## Типичные ошибки

| Ошибка | Симптом |
|--------|---------|
| curl без `-f` | 404 считается OK |
| проверка только TCP | nginx default page / wrong vhost |
| нет retry | flaky fail после deploy |
| healthcheck в том же скрипте, что deploy | exit code смешан |

---

## В продакшене

Отдельный репозиторий или `scripts/health/` в mono-repo. Версионируйте пороги (200 vs 204). Synthetic checks извне (blackbox exporter).

---

## Резюме

**Healthcheck** — доказательство «сервис жив» для CI. **exit 1** при fail. TCP + HTTP + опционально SSH/systemd.

## Чек-лист

- [ ] Почему отдельный скрипт, а не inline в YAML?
- [ ] Какой exit code ждёт GitLab?
- [ ] Зачем curl `-f`?

Следующий урок: [16. Финальный проект](16-final-project.md).
