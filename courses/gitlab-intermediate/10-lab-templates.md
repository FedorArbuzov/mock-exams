# 10. Лаба: шаблон docker-build

## Сценарий с работы

Platform engineering: «один PR в `ci-templates` — все сервисы получают patched dind config». На учебном GitLab достаточно **`include: local`** в `hello-ci`. Паттерн идентичен production group-level templates; меняется только `project:` и `ref:`. Без templates 15 микросервисов = 15 копий `docker login` — drift неизбежен.

**Предусловия:** [09-ci-templates.md](09-ci-templates.md), рабочий `docker-build` из [04-lab-build-push.md](04-lab-build-push.md).

## Что вы сделаете

- Вынесете `.docker-build` в `ci/docker-build.yml`.
- Подключите через `include: local`.
- Переименуете job в `build-image` с `extends`.
- Измените template и убедитесь, что pipeline подхватил изменение без правки корневого script.

---

## Задание 1. Файл template

Создайте `ci/docker-build.yml`:

```yaml
.docker-build:
  stage: build
  image: docker:24-cli
  services:
    - name: docker:24-dind
      alias: docker
  variables:
    DOCKER_TLS_CERTDIR: "/certs"
    DOCKER_HOST: tcp://docker:2376
    DOCKER_TLS_VERIFY: "1"
    DOCKER_CERT_PATH: "$DOCKER_TLS_CERTDIR/client"
  tags: [docker]
  before_script:
    - docker login -u "$CI_REGISTRY_USER" -p "$CI_REGISTRY_PASSWORD" "$CI_REGISTRY"
  script:
    - docker build -t "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA" .
    - docker push "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
    - docker images | head -5
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
```

Имя `.docker-build` с точкой — **hidden job**; GitLab не создаёт job в pipeline.

`docker images | head -5` — намеренно для задания 3 (видимость изменений в логе).

---

## Задание 2. Корневой `.gitlab-ci.yml`

```yaml
include:
  - local: ci/docker-build.yml

stages:
  - validate
  - test
  - build
  - deploy

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
    - pip install --quiet ruff && ruff check . || true

unit:
  stage: test
  needs: [lint]
  image: python:3.12-slim
  tags: [docker]
  script:
    - pip install --quiet pytest
    - |
      if [ -d tests ]; then pytest -q; else echo "skip"; fi

build-image:
  extends: .docker-build
  needs: [unit]

# deploy-staging / deploy-production из лабы 08
```

Удалите inline `docker-build`. **CI/CD → Editor → Validate** — valid.

**Ожидаемый результат:** pipeline green, job `build-image`, образ в registry на [`deploy/gitlab`](../../deploy/gitlab/README.md).

| Элемент | Роль |
|---------|------|
| `include: local` | подключить YAML из репозитория |
| `extends: .docker-build` | наследовать dind, login, push |
| `needs: [unit]` | переопределение только зависимостей |

---

## Задание 3. Изменение template

В `ci/docker-build.yml` добавьте в `script`:

```yaml
    - echo "Template version 2 — build OK"
```

Commit. В логе `build-image` — новая строка **без** копирования script в корень `.gitlab-ci.yml`.

Это и есть value proposition templates: одно место правды.

---

## Задание 4. (Бонус) Group project

Создайте group `platform`, проект `ci-templates`, скопируйте `ci/docker-build.yml` в `/jobs/docker-build.yml`.

В сервисе:

```yaml
include:
  - project: platform/ci-templates
    ref: v1.0.0
    file: /jobs/docker-build.yml
```

После первого стабильного релиза — tag `v1.0.0`. Не pin на `main` в production ([09-ci-templates.md](09-ci-templates.md)).

---

## Задание 5. (Бонус) Template deploy

Вынесите `.deploy-base` из [08-lab-environments.md](08-lab-environments.md) в `ci/deploy-k8s.yml`:

```yaml
include:
  - local: ci/docker-build.yml
  - local: ci/deploy-k8s.yml
```

Корневой файл остаётся тонким: stages, workflow, lint, unit, extends.

---

## Что пошло не так

### `extends: .docker-build` — job not found

**Причина:** неверный путь `local:`; файл не в git.

**Решение:** `git add ci/docker-build.yml`; путь `ci/docker-build.yml` без ведущего `/`.

### Duplicate job names

**Причина:** старый `docker-build` + `build-image`.

**Решение:** удалить inline job полностью.

### Include invalid YAML

**Решение:** CI lint; yamllint локально.

### Изменение template не видно

**Причина:** смотрите старый pipeline.

**Решение:** новый pipeline на HEAD commit.

### `extends` не переопределяет `rules`

**Причина:** дочерний job должен явно задать `rules` если нужно иное поведение.

**Решение:** merge rules в дочернем job перезаписывает родительский полностью (не merge).

---

## Резюме

- `include: local` — первый шаг к platform-wide templates.
- Изменение в `ci/` — один commit вместо правки 15 репозиториев.

---

## Критерии успеха

- [ ] `include: local: ci/docker-build.yml` работает
- [ ] `build-image` extends `.docker-build`
- [ ] Изменение только в `ci/` отражается в pipeline
- [ ] Нет дублирования docker script в корне
- [ ] (Бонус) второй include для deploy

---

## Связи

| Дальше | Содержание |
|--------|------------|
| [11-terraform-ci.md](11-terraform-ci.md) | template для terraform |
| [13-final-project.md](13-final-project.md) | include в финале |

Следующий урок: [11-terraform-ci.md](11-terraform-ci.md).
