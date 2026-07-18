# 02. Лаба: validate → test → build (stub)

## Сценарий с работы

На собеседовании спрашивают: «опишите ваш CI». Ответ «у нас есть stages» без DAG и фильтра веток звучит слабо. Реальные команды фиксируют: **MR не собирает образ**, пока не прошли lint и unit; **feature branch без MR** не жжёт runner minutes; **новый push в MR** отменяет старый pipeline. Эта лаба — минимальный скелет, который в главах 03–06 вы наполните Docker build и deploy в mockctl.

**Предусловия:** [00-environment.md](00-environment.md), проект `hello-ci` в GitLab на [`deploy/gitlab`](../../deploy/gitlab/README.md), runner с tag `docker`. Теория: [01-multi-stage.md](01-multi-stage.md).

## Что вы сделаете

- Соберёте `.gitlab-ci.yml` с stages `validate` → `test` → `build`.
- Настроите `needs` между jobs — DAG вместо «весь stage test ждёт integration».
- Добавите `workflow:rules` для MR и `main` — feature push без MR не создаёт pipeline.
- Проверите pipeline graph и auto-cancel redundant pipelines.

---

## Задание 1. Базовый pipeline

Создайте или замените `.gitlab-ci.yml` в корне проекта:

```yaml
stages:
  - validate
  - test
  - build

workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
    - when: never

lint:
  stage: validate
  image: python:3.12-slim
  tags: [docker]
  script:
    - pip install --quiet ruff
    - ruff check . || true    # уберите || true после добавления кода

unit:
  stage: test
  needs: [lint]
  image: python:3.12-slim
  tags: [docker]
  script:
    - pip install --quiet pytest
    - |
      if [ -d tests ]; then pytest -q; else echo "no tests yet — OK"; fi

build-stub:
  stage: build
  needs: [unit]
  image: alpine:3.19
  tags: [docker]
  script:
    - echo "Would build image $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
    - echo "Registry host $CI_REGISTRY"
```

**Ожидаемый результат:** pipeline **passed**, в логе `build-stub` — `CI_COMMIT_SHA` (40 символов hex) и путь `CI_REGISTRY_IMAGE`.

Если перенесли тесты из [`gitlab-basic/examples/hello-ci`](../gitlab-basic/examples/hello-ci/) — уберите `|| true` у ruff.

| Job | Зависимость | Что проверяет |
|-----|-------------|---------------|
| `lint` | — | стиль кода, fail fast |
| `unit` | `needs: [lint]` | бизнес-логика |
| `build-stub` | `needs: [unit]` | готовность к docker (пока echo) |

Построчно: `workflow:rules` с `when: never` в конце — **ключевой** паттерн курса; без него push в `feature/x` создаст pipeline.

---

## Задание 2. Merge Request и граф зависимостей

1. Ветка `feature/multi-stage-lab`.
2. Commit + push → **Merge Request** в `main`.
3. **CI/CD → Pipelines → Graph**.

**Проверьте:**

| Утверждение | Как проверить |
|-------------|---------------|
| `lint` → `unit` → `build-stub` | стрелки `needs` в graph |
| `build-stub` не стартует до `unit` | timestamps jobs |
| Push без MR не создаёт pipeline | ветка `feature/no-mr`, push, нет pipeline |

Скриншот graph — для [13-final-project.md](13-final-project.md) и портфолио.

**Почему MR pipeline:** `CI_PIPELINE_SOURCE == "merge_request_event"` — отдельный pipeline с контекстом MR; merge в `main` запустит branch pipeline на `main` с deploy (позже).

---

## Задание 3. Auto-cancel redundant pipelines

**Settings → CI/CD → General pipelines → Auto-cancel redundant pipelines** — включите.

1. Откройте MR.
2. Два быстрых push (`git commit --allow-empty -m "trigger"`).
3. Первый pipeline → **canceled**, второй выполняется.

Стандарт в busy monorepo: не тратить runners на устаревший commit. На учебном GitLab один runner — экономия времени ощутима.

---

## Задание 4. (Опционально) Замедлить integration

```yaml
integration:
  stage: test
  needs: [lint]
  image: alpine
  tags: [docker]
  script:
    - sleep 30
    - echo "slow test"
```

Убедитесь: `build-stub` с `needs: [unit]` **не ждёт** `integration` — только `unit`. Демонстрация DAG из [01-multi-stage.md](01-multi-stage.md).

Альтернатива без `needs`: вынести `integration` в отдельный stage `integration-test` **после** `build` — но тогда build ждёт integration. DAG гибче.

---

## Задание 5. (Опционально) Переменные в логе

Добавьте в `build-stub`:

```yaml
  script:
    - echo "SHA=$CI_COMMIT_SHA"
    - echo "REF=$CI_COMMIT_REF_NAME"
    - echo "SOURCE=$CI_PIPELINE_SOURCE"
    - echo "Would build $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
```

На MR: `CI_PIPELINE_SOURCE=merge_request_event`. На main после merge: `push` на protected branch.

---

## Что пошло не так

### Pipeline pending бесконечно

**Симптом:** жёлтый значок, нет runner.

**Причина:** tags `[docker]` не совпадают с runner.

**Решение:** Settings → CI/CD → Runners; `docker ps` — `mock-gitlab-runner` жив. См. [00-environment.md](00-environment.md).

### `build-stub` стартовал до `unit`

**Причина:** забыли `needs: [unit]` или оба job в одном stage без зависимости.

**Решение:** проверить `stage:` и `needs:`; в graph не должно быть параллели lint/unit/build без стрелок.

### Pipeline на feature branch без MR

**Причина:** нет `when: never` в конце `workflow:rules`.

**Решение:** блок `workflow` из задания 1.

### ruff падает на пустом репо

**Решение:** `app/__init__.py` или временно `allow_failure: true` на lint.

### YAML invalid

**Причина:** табы вместо пробелов.

**Решение:** CI/CD → Editor → Validate.

### Два pipeline на один push в MR

**Причина:** GitLab создаёт и branch, и MR pipeline (настройка проекта).

**Решение:** Settings → CI/CD → «Merge request pipelines» / отключить branch pipeline для MR — или оставить оба, но `workflow:rules` ограничит лишнее.

---

## Резюме

- Скелет pipeline: validate → test → build с `needs` и `workflow:rules`.
- MR pipeline — основной путь review; main — для deploy (позже).
- Auto-cancel — must-have для экономии runner time.

---

## Критерии успеха

- [ ] DAG `lint` → `unit` → `build-stub` виден в pipeline graph
- [ ] `workflow:rules` — pipeline только на MR и `main`
- [ ] Auto-cancel redundant pipelines включён и проверен
- [ ] В логе build-stub корректные `$CI_REGISTRY_IMAGE` и `$CI_COMMIT_SHA`
- [ ] MR можно смержить (pipeline green)

---

## Связи

| Дальше | Содержание |
|--------|------------|
| [03-docker-registry.md](03-docker-registry.md) | заменить stub на реальный docker build |
| [04-lab-build-push.md](04-lab-build-push.md) | push в registry |
| [gitlab-basic/04](../gitlab-basic/04-lab-first-pipeline.md) | если застряли на basics |

Следующий урок: [03-docker-registry.md](03-docker-registry.md).
