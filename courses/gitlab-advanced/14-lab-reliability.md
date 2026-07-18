# 14. Лаба: retries и interruptible

## Сценарий с работы

Developer жалуется: «Я запушил fix, а pipeline всё ещё гоняет старый commit 10 минут». Platform engineer добавляет `interruptible: true` — проблема исчезает. Эта лаба учит настраивать reliability осознанно.

Без runbook on-call каждый раз «изобретает» диагностику заново. Вы оформите `docs/ci-runbook.md` — артефакт, который переживёт смену дежурного.

---

## Цель лабораторной

Применить **`interruptible`**, **`resource_group`**, **`timeout`**, **`retry`**; воспроизвести отмену старого pipeline; оформить **`docs/ci-runbook.md`**.

**Время:** ~90 минут.  
**Предварительно:** [13-pipeline-reliability.md](13-pipeline-reliability.md).

---

## Задание 1. Interruptible на test jobs

```yaml
unit-tests:
  stage: test
  interruptible: true
  script:
    - pytest -q

sast:
  interruptible: true

container-scan:
  interruptible: true
```

**Не** на:

```yaml
bump-gitops:
  interruptible: false

bump-gitops-production:
  interruptible: false
```

---

## Задание 2. resource_group на production

```yaml
bump-gitops-staging:
  stage: deploy
  resource_group: staging
  # ... bump из лабы 12

bump-gitops-production:
  stage: deploy
  resource_group: production
  when: manual
  environment:
    name: production
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

Два manual trigger — второй **ждёт** первого в group.

---

## Задание 3. Симуляция отмены pipeline

На MR:

```yaml
unit-tests:
  script:
    - pytest -q
    - sleep 120
```

1. Push → running job
2. Empty commit → push
3. Первый job → **canceled**

Скрин в `docs/interruptible-demo.md`. Уберите `sleep`.

---

## Задание 4. timeout

```yaml
integration-tests:
  stage: test
  timeout: 5m
  script:
    - ./run-integration.sh
```

---

## Задание 5. retry (infra only)

```yaml
docker-build:
  retry:
    max: 2
    when:
      - runner_system_failure
      - stuck_or_timeout_failure
```

**Не** `script_failure` на unit tests.

---

## Задание 6. workflow rules

```yaml
workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main" && $CI_OPEN_MERGE_REQUESTS
      when: never
    - if: $CI_COMMIT_BRANCH == "main"
    - when: never
```

---

## Задание 7. docs/ci-runbook.md

Минимум **5 сценариев** из [13](13-pipeline-reliability.md):

Для каждого: **Симптом**, **Проверка**, **Fix**, **Эскалация**.

```markdown
## Pending job > 15 min

**Симптом:** Job gray, no runner.

**Проверка:** Settings → Runners online? Tags match?

**Fix:** Register runner / add tag `k8s`.

**Эскалация:** Platform if quota exceeded.
```

Добавьте **Security scan failed** и **Argo OutOfSync**.

---

## Задание 8. Уведомления (опционально)

Settings → Integrations → Slack: pipeline failure on default branch.

Документируйте канал в runbook § Escalation.

---

## Задание 9. Cache для ускорения (опционально)

```yaml
unit-tests:
  cache:
    key:
      files: [requirements.txt]
    paths: [.pip-cache/]
  script:
    - pip install -r requirements.txt --cache-dir .pip-cache
    - pytest -q
```

---

## Критерии успеха

- [ ] Test jobs interruptible; deploy/bump — false
- [ ] Второй push отменяет первый pipeline
- [ ] `resource_group: production` сериализует deploys
- [ ] `docs/ci-runbook.md` ≥ 5 сценариев
- [ ] `retry` только infra (docker-build)

---

## Вопросы для рефлексии

1. Почему cancel старого MR pipeline — feature?
2. Когда `resource_group` спасает production?
3. Почему runbook отделяют от README?

---

## Резюме

Reliability patterns — не luxury, а часть platform pipeline. Runbook — обязательный артефакт. Следующий урок: [15-final-project.md](15-final-project.md).
