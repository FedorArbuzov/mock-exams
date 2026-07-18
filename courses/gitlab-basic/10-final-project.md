# 10. Финальный проект: CI для hello-ci

## Введение: сценарий с работы

Конец спринта. Product owner: «Каждый MR в `hello-ci` должен проходить lint, unit с coverage, собирать wheel — как в проде». Вы собираете **эталонный basic pipeline**: protected `main`, variables, artifacts, cache, история MR failed → fixed. Это артефакт для портфолио и входной билет в [`gitlab-intermediate`](../gitlab-intermediate/README.md) (docker build + registry на `:8929`).

Проект оценивается **чек-листом**, не «на глаз». Время: **2–3 часа**.

## Что вы сдаёте

- GitLab project (локальный `:8929` или скрины).
- MR с осмысленными commits и **одним** циклом intentional failure.
- README в project: локальный запуск + описание CI.
- `.gitlab-ci.yml`, удовлетворяющий таблице требований.

---

## Цель

Полный **basic pipeline** для [`examples/hello-ci/`](examples/hello-ci/):

```text
MR / push main
    → stage test: lint (ruff) ∥ unit (pytest + coverage)
    → stage build: package (wheel artifact + APP_VERSION)
```

Связь с **DORA**: частые маленькие MR с автоматическими проверками снижают **Change Failure Rate** и дают быстрый feedback ([`devops-culture`](../devops-culture/03-dora-metrics.md)).

---

## Требования (чек-лист сдачи)

| # | Критерий | Как проверить |
|---|----------|---------------|
| 1 | Protected branch `main`, merge через MR | push в main rejected |
| 2 | Stages: `test`, `build` (в таком порядке) | UI pipeline |
| 3 | Jobs `lint` и `unit` параллельны в `test` | graph |
| 4 | `rules`: MR + `main` на основных jobs | push feature без rules — нет лишних jobs |
| 5 | Masked variable `APP_VERSION` в build | Settings → Variables; используется в script |
| 6 | Artifacts: wheel в `out/` + `coverage.xml` | Download artifacts |
| 7 | Cache pip с key от lockfile/requirements | второй pipeline быстрее |
| 8 | `tags: [docker]` на jobs | нет pending |
| 9 | MR с failed → fixed pipeline | история MR |
| 10 | README: локальный pytest + что делает CI | файл в repo |

Опционально: **pipeline badge** в README:

```markdown
[![pipeline status](http://localhost:8929/root/hello-ci/badges/main/pipeline.svg)](http://localhost:8929/root/hello-ci/-/commits/main)
```

---

## Рекомендуемая структура `.gitlab-ci.yml`

Соберите **сами** — ниже ориентир, не копируйте слепо без понимания:

```yaml
stages:
  - test
  - build

default:
  image: python:3.12-slim
  tags:
    - docker
  cache:
    key:
      files:
        - requirements-dev.txt
    paths:
      - .cache/pip

variables:
  PIP_CACHE_DIR: "$CI_PROJECT_DIR/.cache/pip"

.workflow_rules:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"

lint:
  stage: test
  extends: .workflow_rules
  script:
    - pip install ruff
    - ruff check app/ tests/

unit:
  stage: test
  extends: .workflow_rules
  script:
    - pip install pytest pytest-cov
    - pip install -e .
    - pytest tests/ -v --cov=app --cov-report=xml:coverage.xml
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage.xml
    paths:
      - coverage.xml
    expire_in: 1 week

package:
  stage: build
  extends: .workflow_rules
  script:
    - pip install build
    - echo "Building version $APP_VERSION"
  # ДОБАВЬТЕ: python -m build, копирование whl, artifacts paths out/
  artifacts:
    paths:
      - out/
    expire_in: 1 day
```

**Ваша задача:** дописать `package` (build wheel, `out/`), завести `APP_VERSION` в CI/CD Variables (masked по желанию, не secret — но практика mask для версий не обязательна).

---

## Variable APP_VERSION

**Settings → CI/CD → Variables:**

| Key | Value | Mask | Protect |
|-----|-------|------|---------|
| `APP_VERSION` | `1.0.0-ci` | optional | optional |

В `package` script:

```yaml
- test -n "$APP_VERSION"
- echo "$APP_VERSION" > out/VERSION
```

Не хардкодить версию в Git, если PO меняет её в variables.

---

## README проекта (шаблон)

```markdown
# hello-ci

Demo app for GitLab CI basic course.

## Local

pip install -r requirements-dev.txt
pytest tests/ -v
ruff check app/ tests/

## CI

| Stage | Jobs |
|-------|------|
| test | lint (ruff), unit (pytest + coverage) |
| build | package (wheel) |

Triggers: merge request and main branch.
Secrets: none in repo; APP_VERSION in CI variables.

GitLab: http://localhost:8929/root/hello-ci
```

---

## Процесс сдачи (самопроверка)

1. Создайте issue «Final CI pipeline».
2. Branch `feature/final-ci`.
3. Commits с Conventional Commits (`feat(ci): ...`, `fix(test): ...`).
4. MR → дождитесь green.
5. Намеренно сломайте lint (unused import) → push → fix → push.
6. Merge в `main` → pipeline на main green.
7. Сверьте таблицу требований.

---

## Типичные ошибки на финале

| Ошибка | Как ловится |
|--------|-------------|
| `unit` в stage `build` | нарушен порядок test перед build |
| Coverage artifact без pytest-cov | пустой coverage.xml |
| APP_VERSION в git | security review fail |
| Нет protected main | требование #1 |
| Один giant job вместо lint∥unit | нет параллельности |
| Забыли `pip install -e .` | unit ModuleNotFoundError |

---

## Дальше

| Курс | Тема |
|------|------|
| [`gitlab-intermediate`](../gitlab-intermediate/README.md) | Docker build, push в registry `:8929`, deploy |
| [`kuber-basic`](../kuber-basic/README.md) | кластер для deploy |
| [`devops-culture`](../devops-culture/README.md) | DORA, team topologies |
| [`secrets-basic`](../secrets-basic/README.md) | Vault в CI |

После сдачи: [interview-cheatsheet.md](interview-cheatsheet.md) и [11-interview-qa.md](11-interview-qa.md).

---

## Резюме

Финальный проект объединяет Git workflow, YAML, runners, variables, artifacts, cache — минимальный **production-like** CI для Python-сервиса на GitLab CE.

---

## Чек-лист завершения курса

- [ ] Все 10 пунктов таблицы требований выполнены
- [ ] MR с историей fail/fix
- [ ] README актуален
- [ ] Можете объяснить pipeline коллеге за 5 минут
- [ ] Готовы к intermediate

---

**gitlab-basic завершён.**
