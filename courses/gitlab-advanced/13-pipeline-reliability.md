# 13. Pipeline reliability

## Сценарий с работы

Команда перестала доверять CI: «зелёный со второго раза» — норма. Developers жмут **Retry** не глядя. On-call тушит pipelines 40 минут — runner disk full. Reliability CI — **предсказуемость релизов**, не luxury.

Эта глава — практики GitLab CI для устойчивости без маскировки багов в коде.

---

## Что вы узнаете

- `retry`, `interruptible`, `timeout`, `resource_group`.
- Workflow rules и duplicate pipelines.
- Caching, monitoring и runbook patterns.

---

## `retry`: когда уместен

```yaml
integration-tests:
  retry:
    max: 2
    when:
      - runner_system_failure
      - stuck_or_timeout_failure
      - scheduler_failure
```

| `when` | Смысл |
|--------|-------|
| `runner_system_failure` | VM crash, docker daemon |
| `stuck_or_timeout_failure` | job timeout infrastructure |
| `script_failure` | **осторожно** — скрывает баг |

**Не ставьте** `max: 10` на unit tests — flaky test чинить, не ретраить.

---

## `interruptible`: экономия runners

```yaml
unit-tests:
  interruptible: true

deploy-production:
  interruptible: false
```

Новый push отменяет старые running jobs с `interruptible: true`:

- Меньше очередь
- Быстрее feedback на последний commit MR

**Never interruptible:** deploy, migrate DB, long integration с side effects.

---

## `timeout`

```yaml
integration:
  timeout: 30m

docker-build:
  timeout: 45m
```

Явный timeout освобождает runner и fail fast.

Согласуйте с `poll_timeout` kubernetes executor ([09-runners-kubernetes.md](09-runners-kubernetes.md)).

---

## `resource_group`: сериализация

```yaml
deploy-staging:
  resource_group: staging

deploy-production:
  resource_group: production
  when: manual
```

Один **resource group** — один job одновременно **across pipelines**.

Use cases: deploy в env, terraform apply, DB migrations.

**vs `needs`:** `needs` — DAG порядок; `resource_group` — mutex.

---

## Workflow rules и duplicate pipelines

```yaml
workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main" && $CI_OPEN_MERGE_REQUESTS
      when: never
    - if: $CI_COMMIT_BRANCH == "main"
```

Избегайте двух pipelines на MR + branch push.

---

## Caching и artifacts

| Проблема | Решение |
|----------|---------|
| Slow `pip install` | cache keyed by lock file |
| Huge artifacts | `expire_in: 1 day` |
| Cache poison | key includes lock hash |

```yaml
cache:
  key:
    files: [requirements.txt]
  paths: [.pip-cache/]
```

---

## Monitoring pipelines

| Канал | Алерт |
|-------|-------|
| Slack integration | failed pipeline on `main` |
| gitlab_exporter | queue depth, runner status |
| Dashboard | p50/p95 duration |

On-call runbook — [14-lab-reliability.md](14-lab-reliability.md).

---

## Runbook (типовые сбои)

| Симптом | Диагностика | Действие |
|---------|-------------|----------|
| Jobs `pending` forever | Runners online? Tags? | Fix runner/tags |
| `OOMKilled` build | Runner memory | Increase limit / Kaniko |
| Registry `401` | Token expired | Refresh token |
| Stuck `docker push` | Disk full | Prune images |
| Argo synced, app down | CD issue | Argo health, not re-run CI |
| Security job red flake | Scanner DB | Pin trivy version |

---

## DAG optimization

```yaml
docker-build:
  needs:
    - job: unit-tests
    - job: sast
```

`optional: true` на security — **риск**; только для experiments.

Parallel matrix:

```yaml
test:
  parallel:
    matrix:
      - PYTHON_VERSION: ["3.11", "3.12"]
```

---

## Protected pipelines

- Protected branches → protected variables
- Manual production deploy только maintainers
- No secrets on unprotected MR from forks

Связь: [appsec-fundamentals/07](../appsec-fundamentals/07-cicd-attacks.md).

---

## Pipeline green ≠ deploy success

После GitOps split:

- CI green + bump gitops commit ≠ pod healthy
- Проверяйте Argo Application status
- Runbook должен разделять CI и CD диагностику

---

## Самопроверка

1. `interruptible` — зачем и когда нельзя?
2. `resource_group` vs `needs`?
3. Retry на unit tests — OK?
4. Кто алертится на failed main?
5. Duplicate pipelines — как избежать?

---

## Резюме

Reliability = `timeout`, `interruptible`, `resource_group` + monitoring + runbook. Не путать infra retry с flaky tests. Лаба: [14-lab-reliability.md](14-lab-reliability.md).
