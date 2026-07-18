# 03. `.gitlab-ci.yml`: stages, jobs, image

## Введение: сценарий с работы

Среда, code review. Коллега открывает MR с `.gitlab-ci.yml` — 80 строк, три stage, job `deploy` без `rules`, и в комментарии: «Почему pipeline не запустился на моём push в `docs/fix-typo`?» Второй кейс: job `test` падает с `python: not found` — в YAML забыли `image`. Третий: два job в разных stages называются одинаково `test` — GitLab ругается на duplicate key. Вы открываете **CI/CD → Editor → Validate** — YAML syntax error на табе вместо пробелов.

Эта глава — **анатомия pipeline**: как GitLab превращает файл в очередь jobs и что настраивать в каждом job.

## Что вы узнаете

- Структура: **pipeline → stages → jobs**.
- Ключи job: `stage`, `image`, `script`, `before_script`, `rules`, `tags`.
- Параллельность внутри stage и порядок между stages.
- **Predefined CI variables** (`CI_COMMIT_BRANCH`, `CI_PIPELINE_SOURCE`, …).
- Почему pipeline **не создаётся** или **пустой**.
- `rules` vs устаревший `only`/`except`.

---

## Где живёт конфиг

Файл **`.gitlab-ci.yml`** в **корне** репозитория (по умолчанию). Альтернативный путь — Settings → CI/CD → General pipelines.

```text
hello-ci/
├── .gitlab-ci.yml    ← GitLab читает при push/MR
├── app/
└── tests/
```

GitLab **не выполняет** YAML на сервере как Python — он **парсит** конфиг и создаёт **jobs** для **runners**.

```text
.gitlab-ci.yml → Pipeline #42
    → Stage: test → jobs: lint, unit (параллельно)
    → Stage: build → job: package (после успеха test)
```

---

## Минимальный pipeline

```yaml
stages:
  - test

lint:
  stage: test
  image: python:3.12-slim
  script:
    - pip install ruff
    - ruff check app/
```

| Элемент | Роль |
|---------|------|
| `stages` | упорядоченный список этапов |
| `lint` | имя job (уникальное в pipeline) |
| `stage: test` | принадлежность к stage |
| `image` | Docker-образ (docker executor) |
| `script` | команды shell (любая ненулевая exit code = fail) |

Без `stages` GitLab использует implicit stages: `build`, `test`, `deploy` — job без `stage` попадёт в `test`. Явный `stages` — яснее для команды.

---

## Stages и порядок выполнения

```yaml
stages:
  - test
  - build
  - deploy
```

| Правило | Поведение |
|---------|-----------|
| Jobs **одного** stage | параллельно (если хватает runners) |
| Следующий stage | только если **все** jobs предыдущего success (или allowed failure) |
| Падение одного job | stage failed, следующие stages **не запускаются** (по умолчанию) |

```text
test:  [lint] [unit]  — одновременно
         ↓       ↓
       both OK?
         ↓
build: [package]
         ↓
deploy: (в intermediate)
```

На basic часто `test` + `build` без deploy — deploy в [`gitlab-intermediate`](../gitlab-intermediate/README.md) и [`kuber-basic`](../kuber-basic/README.md).

---

## Анатомия job

```yaml
unit:
  stage: test
  image: python:3.12-slim
  tags:
    - docker
  before_script:
    - pip install pytest
  script:
    - pytest tests/ -v
  after_script:
    - echo "Job $CI_JOB_NAME finished with $CI_JOB_STATUS"
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
  timeout: 30m
  retry: 1
```

| Ключ | Назначение |
|------|------------|
| `before_script` | подготовка (deps); наследуется из `default:` |
| `after_script` | выполняется **всегда**, даже при fail (cleanup) |
| `tags` | выбор runner с этими тегами |
| `rules` | когда создавать job |
| `timeout` | kill зависшего job |
| `retry` | повтор при infrastructure fail |
| `allow_failure: true` | job красный, но pipeline green (soft gate) |

### `default` — DRY для всех jobs

```yaml
default:
  image: python:3.12-slim
  tags:
    - docker
  before_script:
    - pip install --upgrade pip

lint:
  stage: test
  script:
    - pip install ruff && ruff check .
```

---

## `image` и docker executor

При **docker executor** runner делает `docker run` указанного образа и выполняет `script` внутри контейнера.

```yaml
job:
  image: python:3.12-slim
  script:
    - python --version
```

| Ситуация | Результат |
|----------|-----------|
| Нет `image` | образ по умолчанию из регистрации runner (`alpine:latest`) — часто нет `python` |
| Неверный tag образа | pull error, job failed |
| Приватный registry | `image` + login через variables (intermediate) |

**services** — sidecar контейнеры (Postgres, Redis) — превью в [06-lab-docker-runner.md](06-lab-docker-runner.md).

---

## `rules`: когда job существует

Современный стиль (рекомендуется):

```yaml
test-unit:
  stage: test
  script:
    - pytest
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
```

Job **не появится** в pipeline, если ни одно rule не сработало — не «skipped», а **отсутствует**.

Частые условия:

| Выражение | Когда |
|-----------|-------|
| `$CI_PIPELINE_SOURCE == "merge_request_event"` | MR pipelines |
| `$CI_COMMIT_BRANCH == "main"` | push в main |
| `$CI_COMMIT_TAG` | релиз по tag |
| `changes: paths` | только если менялись файлы |

Устаревшее (встретите в legacy):

```yaml
only:
  - merge_requests
  - main
except:
  - schedules
```

Миграция на `rules` — проще читать и комбинировать.

---

## Predefined variables

GitLab injects переменные в каждый job:

| Variable | Пример | Зачем |
|----------|--------|-------|
| `CI_COMMIT_BRANCH` | `feature/ci` | rules, script |
| `CI_COMMIT_SHA` | `a1b2c3d4` | артефакты, docker tag |
| `CI_PROJECT_NAME` | `hello-ci` | имена |
| `CI_PROJECT_DIR` | `/builds/root/hello-ci` | рабочая директория в job |
| `CI_PIPELINE_ID` | `42` | ссылки |
| `CI_JOB_NAME` | `unit` | логи |
| `CI_PIPELINE_SOURCE` | `merge_request_event` | rules |
| `CI_REGISTRY` | `localhost:8929` | push образов (CE) |

Полный список: GitLab Docs → **Predefined CI/CD variables**.

Использование в script:

```yaml
script:
  - echo "Building $CI_PROJECT_NAME@$CI_COMMIT_SHORT_SHA on branch $CI_COMMIT_BRANCH"
```

---

## Наследование и `extends`

Для повторяющихся jobs:

```yaml
.python_test:
  image: python:3.12-slim
  before_script:
    - pip install pytest

unit:
  extends: .python_test
  stage: test
  script:
    - pytest tests/
```

Шаблоны с точкой (`.python_test`) — convention, job не создаётся сам по себе.

---

## Когда pipeline не запускается

| Причина | Диагностика |
|---------|-------------|
| Нет `.gitlab-ci.yml` | добавить файл в root |
| YAML syntax error | CI/CD → Editor → **Validate** |
| Все jobs отфильтрованы `rules` | Pipeline exists but empty / few jobs |
| Нет active runner | jobs **pending** (глава 05) |
| CI disabled | Settings → General → Visibility |
| Invalid `stages` name | опечатка в `stage:` job |

### Просмотр лога failed job

**CI/CD → Pipelines → pipeline #N → job name → Trace/log.**

Ищите последние строки: exit code, traceback, `command not found`.

---

## Типичные ошибки

| Ошибка | Симптом | Исправление |
|--------|---------|-------------|
| Табы в YAML | validate fail | только пробелы, 2 spaces |
| Дубликат имени job | pipeline config error | уникальные имена |
| Нет `image` для Python | `python: not found` | `image: python:3.12-slim` |
| `only: branches` без MR | нет pipeline на MR | `rules` + `merge_request_event` |
| `script` многострочный без `-` | YAML parse error | список с `-` |
| Забыли `tags: [docker]` | pending на курсе | добавить tags runner |

---

## Резюме

- `.gitlab-ci.yml` описывает **stages** и **jobs**; runner выполняет `script` в `image`.
- Jobs одного stage — **параллельно**; stages — **последовательно**.
- **`rules`** определяют, попадает ли job в pipeline.
- **Predefined variables** — контекст commit/MR/project без ручного export.
- Валидация YAML в Editor экономит цикл push-fail-fix.

---

## Чек-лист

- [ ] В каком порядке выполняются stages и jobs внутри stage?
- [ ] Зачем `image` при docker executor?
- [ ] Чем `rules` лучше `only`/`except`?
- [ ] Где смотреть лог упавшего job?
- [ ] Что значит `CI_PIPELINE_SOURCE=merge_request_event`?
- [ ] Почему job может отсутствовать в pipeline (не skipped)?

Следующий урок: [04-lab-first-pipeline.md](04-lab-first-pipeline.md).
