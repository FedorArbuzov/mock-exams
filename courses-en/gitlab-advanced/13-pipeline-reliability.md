# 13. Pipeline reliability

## Real-world scenario

The team stopped trusting CI: "green on the second try" is the norm. Developers hit **Retry** without looking. On-call spends 40 minutes putting out pipelines — the runner disk is full. CI reliability is about **predictable releases**, not a luxury.

This chapter covers GitLab CI practices for resilience without masking bugs in the code.

---

## What you'll learn

- `retry`, `interruptible`, `timeout`, `resource_group`.
- Workflow rules and duplicate pipelines.
- Caching, monitoring, and runbook patterns.

---

## `retry`: when it's appropriate

```yaml
integration-tests:
  retry:
    max: 2
    when:
      - runner_system_failure
      - stuck_or_timeout_failure
      - scheduler_failure
```

| `when` | Meaning |
|--------|-------|
| `runner_system_failure` | VM crash, docker daemon |
| `stuck_or_timeout_failure` | job timeout infrastructure |
| `script_failure` | **careful** — hides a bug |

**Don't set** `max: 10` on unit tests — fix flaky tests, don't retry them.

---

## `interruptible`: saving runners

```yaml
unit-tests:
  interruptible: true

deploy-production:
  interruptible: false
```

A new push cancels older running jobs with `interruptible: true`:

- Shorter queue
- Faster feedback on the last commit of an MR

**Never interruptible:** deploy, migrate DB, long integration with side effects.

---

## `timeout`

```yaml
integration:
  timeout: 30m

docker-build:
  timeout: 45m
```

An explicit timeout frees the runner and fails fast.

Coordinate with the `poll_timeout` of the kubernetes executor ([09-runners-kubernetes.md](09-runners-kubernetes.md)).

---

## `resource_group`: serialization

```yaml
deploy-staging:
  resource_group: staging

deploy-production:
  resource_group: production
  when: manual
```

One **resource group** — one job at a time **across pipelines**.

Use cases: deploy to an env, terraform apply, DB migrations.

**vs `needs`:** `needs` — DAG ordering; `resource_group` — a mutex.

---

## Workflow rules and duplicate pipelines

```yaml
workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main" && $CI_OPEN_MERGE_REQUESTS
      when: never
    - if: $CI_COMMIT_BRANCH == "main"
```

Avoid two pipelines on MR + branch push.

---

## Caching and artifacts

| Problem | Solution |
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

| Channel | Alert |
|-------|-------|
| Slack integration | failed pipeline on `main` |
| gitlab_exporter | queue depth, runner status |
| Dashboard | p50/p95 duration |

On-call runbook — [14-lab-reliability.md](14-lab-reliability.md).

---

## Runbook (common failures)

| Symptom | Diagnosis | Action |
|---------|-------------|----------|
| Jobs `pending` forever | Runners online? Tags? | Fix runner/tags |
| `OOMKilled` build | Runner memory | Increase limit / Kaniko |
| Registry `401` | Token expired | Refresh token |
| Stuck `docker push` | Disk full | Prune images |
| Argo synced, app down | CD issue | Argo health, don't re-run CI |
| Security job red flake | Scanner DB | Pin trivy version |

---

## DAG optimization

```yaml
docker-build:
  needs:
    - job: unit-tests
    - job: sast
```

`optional: true` on security is a **risk**; only for experiments.

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
- Manual production deploy for maintainers only
- No secrets on an unprotected MR from forks

Related: [appsec-fundamentals/07](../appsec-fundamentals/07-cicd-attacks.md).

---

## Pipeline green ≠ deploy success

After the GitOps split:

- CI green + a bump gitops commit ≠ a healthy pod
- Check the Argo Application status
- The runbook should separate CI and CD diagnostics

---

## Self-check

1. `interruptible` — why and when not to?
2. `resource_group` vs `needs`?
3. Retry on unit tests — OK?
4. Who gets alerted on a failed main?
5. Duplicate pipelines — how to avoid them?

---

## Summary

Reliability = `timeout`, `interruptible`, `resource_group` + monitoring + runbook. Don't confuse infra retry with flaky tests. Lab: [14-lab-reliability.md](14-lab-reliability.md).
