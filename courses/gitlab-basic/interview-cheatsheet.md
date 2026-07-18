# GitLab Basic — шпаргалка к собеседованию

Проверьте себя **без подглядывания** в главы 00–10, затем откройте разборы в [11-interview-qa.md](11-interview-qa.md).

---

## Git + MR

| Концепт | Суть |
|---------|------|
| Trunk-based | короткие feature-ветки → частый merge в `main` |
| MR | review + CI до merge; `Closes #N` |
| Protected branch | push в `main` запрещён; pipeline must succeed |
| Conventional Commits | `feat(scope): subject` — changelog, автоматизация |

**Триггеры CI:** push, `merge_request_event`, tag, schedule — зависит от `rules`.

---

## Архитектура CI

```text
push/MR → GitLab (планировщик) → jobs pending → Runner (исполнитель) → success/fail
```

| Компонент | Роль |
|-----------|------|
| GitLab CE | Git, UI, парсинг `.gitlab-ci.yml` |
| Runner | выполняет `script`; без него — **pending** |
| `image` | Docker-образ job (docker executor) |

Локальный стенд: **http://localhost:8929** — [`deploy/gitlab`](../../deploy/gitlab/README.md).

---

## `.gitlab-ci.yml`

```yaml
stages: [test, build]    # stages последовательно; jobs в stage — параллельно

job-name:
  stage: test
  image: python:3.12-slim
  tags: [docker]
  script: [...]
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

| Ключ | Зачем |
|------|-------|
| `before_script` | deps, login |
| `after_script` | cleanup (всегда) |
| `rules` | когда job в pipeline |
| `extends` | DRY шаблоны |
| `allow_failure: true` | красный job, зелёный pipeline |

**Predefined:** `CI_COMMIT_BRANCH`, `CI_COMMIT_SHA`, `CI_JOB_NAME`, `CI_PIPELINE_SOURCE`, `CI_JOB_TOKEN`, `CI_REGISTRY`.

---

## Runners

| Тип | Область |
|-----|---------|
| Instance | весь GitLab |
| Group | группа проектов |
| Project | один project |

| Executor | Среда |
|----------|-------|
| docker | контейнер (`image`) |
| shell | VM runner напрямую |
| kubernetes | pod ([`kuber-basic`](../kuber-basic/README.md)) |

**Tags:** job `tags` ∩ runner tags — иначе **pending**.

**Безопасность:** docker socket = root на хосте; изоляция runner VM.

---

## Variables

| Уровень | Где |
|---------|-----|
| Project | Settings → CI/CD → Variables |
| Group | Group → CI/CD → Variables |

| Флаг | Эффект |
|------|--------|
| Mask | скрыть в log (не 100%; длина ≥ 8) |
| Protect | только protected branches |
| File | значение → временный файл `$VAR` |

**Никогда** секреты в Git. Vault: [`secrets-basic`](../secrets-basic/README.md).

---

## Artifacts vs Cache

| | Artifacts | Cache |
|---|-----------|-------|
| Назначение | передать файлы между jobs | ускорить повторный pipeline |
| Надёжность | высокая | best-effort |
| UI download | да | нет |
| TTL | `expire_in` | key + policy |

```yaml
artifacts:
  paths: [out/]
  reports:
    junit: report.xml
dependencies: [build]   # откуда скачать artifacts
```

```yaml
cache:
  key:
    files: [requirements.txt]
  paths: [.cache/pip]
```

---

## Диагностика

| Симптом | Частая причина |
|---------|----------------|
| Нет pipeline | нет `.gitlab-ci.yml`, CI off |
| Pending | runner offline / tag mismatch |
| Failed | script exit ≠ 0, нет `image` |
| Job отсутствует | `rules` не сработали |
| YAML error | табы, Validate в Editor |

Лог: **CI/CD → Pipelines → job → Trace**.

---

## DORA (связь)

| Метрика | CI помогает |
|---------|-------------|
| Deployment Frequency | частые MR + green pipeline |
| Lead Time for Changes | быстрый feedback lint/test |
| Change Failure Rate | тесты до merge |
| MTTR | artifacts/logs при fail |

Подробнее: [`devops-culture/03-dora-metrics`](../devops-culture/03-dora-metrics.md).

---

## Следующий уровень

| Курс | Тема |
|------|------|
| `gitlab-intermediate` | docker build, registry, deploy |
| `gitlab-advanced` | K8s runner, GitOps |
| `kuber-basic` | кластер |

---

## Быстрый чек перед интервью

- [ ] Runner vs GitLab server
- [ ] `rules` vs `only`
- [ ] Artifacts vs cache
- [ ] Masked variables — ограничения
- [ ] Почему job pending
- [ ] Stages vs parallel jobs
- [ ] `CI_JOB_TOKEN` — зачем
- [ ] Protected branch + MR workflow
