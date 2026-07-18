# 01. Multi-stage pipelines

## Сценарий с работы

Среда, 10:00. Feature branch — push. Pipeline: lint 30 с, unit 2 мин, **docker build 8 мин**, deploy staging 3 мин. Вы меняете одну строку в README — снова **13 минут**. Tech lead: «почему build бежит до тестов?» В `.gitlab-ci.yml` все jobs в stage `build` стартуют **параллельно** с `unit`. Второй кейс: pipeline на `feature/foo` деплоит в staging — забыли `workflow:rules`. Третий: MR pipeline и branch pipeline дублируются — двойной расход runner minutes.

Intermediate начинается с **управляемой цепочки**: validate → test → build → deploy, с **DAG** (`needs`) и **фильтром** pipeline (`workflow:rules`). Фундамент для registry ([03](03-docker-registry.md)), mockctl deploy ([05](05-deploy-kubernetes.md)) и Terraform ([11](11-terraform-ci.md)).

Стенд: [00-environment.md](00-environment.md). База YAML: [gitlab-basic/03-gitlab-ci-yaml.md](../gitlab-basic/03-gitlab-ci-yaml.md).

## Что вы узнаете

- Зачем несколько **stages** и как GitLab их упорядочивает.
- Как **`needs`** строит DAG и ускоряет pipeline.
- Как **`workflow:rules`** отключает лишние pipeline.
- Паттерн **fail fast** — дорогие jobs только после зелёных тестов.
- Разницу `only/except` (legacy) и **`rules`**.

---

## Типичная цепочка DevOps

```text
commit / MR
    │
    ▼
┌───────────┐    ┌──────────┐    ┌─────────────┐    ┌──────────────┐
│ validate  │───▶│   test   │───▶│    build    │───▶│    deploy    │
│ lint, fmt │    │ unit,    │    │ docker push │    │ helm/kubectl │
│ tf validate│   │ integration│  │ scan (stub) │    │ (env-specific)│
└───────────┘    └──────────┘    └─────────────┘    └──────────────┘
```

На **MR**: validate + test + build (без prod deploy). На **main**: + auto staging + manual production ([07-environments.md](07-environments.md)).

В [`deploy/gitlab`](../../deploy/gitlab/README.md) runner minutes ограничены одним агентом — оптимизация DAG ощутима сразу.

---

## Stages: порядок по умолчанию

```yaml
stages:
  - validate
  - test
  - build
  - deploy
```

| Stage | Типичные jobs | Стоимость |
|-------|---------------|-----------|
| validate | ruff, `terraform fmt -check`, `yamllint` | низкая |
| test | pytest, `go test`, smoke API | средняя |
| build | `docker build`, compile artifacts | **высокая** |
| deploy | kubectl, helm, terraform apply | высокая + риск |

**Правило GitLab:** все jobs stage `N` должны **успешно завершиться**, прежде чем стартует stage `N+1` (если нет `needs` с перекрёстными зависимостями).

Job без явного `stage` попадает в первый из списка — частая ошибка новичков.

```yaml
lint:
  stage: validate
  image: python:3.12-slim
  script:
    - pip install ruff && ruff check .

unit:
  stage: test
  image: python:3.12-slim
  script:
    - pip install pytest && pytest -q
```

Построчно: `stage:` определяет «этаж» pipeline; jobs одного stage по умолчанию **параллельны**.

---

## `needs` — directed acyclic graph (DAG)

Без `needs` job `docker-build` в stage `build` ждёт **все** jobs stage `test` — включая медленный integration, хотя unit уже зелёный.

```yaml
docker-build:
  stage: build
  needs:
    - job: unit
      artifacts: false
  tags: [docker]
  image: docker:24-cli
  services:
    - docker:24-dind
  script:
    - echo "Would build $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
```

| Аспект | Поведение |
|--------|-----------|
| `needs: [unit]` | build стартует сразу после **unit**, не ждёт другие test-jobs |
| `artifacts: false` | не скачивать artifacts unit (быстрее старт) |
| Циклы | GitLab запрещает циклические `needs` |

В UI **CI/CD → Pipelines → Graph** стрелки `needs` видны явно — проверяйте после рефакторинга.

**Ограничение:** deploy не должен зависеть только от lint, минуя test — это ломает fail fast.

---

## `workflow:rules` — когда pipeline существует

`rules` на job фильтруют **отдельный job**. `workflow:rules` фильтруют **весь pipeline**.

```yaml
workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
    - when: never
```

| Событие | Pipeline? |
|---------|-----------|
| Push в MR | да (MR pipeline) |
| Push в `main` | да |
| Push в `feature/x` без MR | **нет** |

Экономит runner minutes и убирает случайный deploy с feature branch.

На уровне job:

```yaml
deploy-staging:
  stage: deploy
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
  script:
    - echo deploy
```

---

## Fail fast

**Антипаттерн:** `docker-build` в stage `test` «для скорости» — образ собирается до pytest.

**Паттерн:**

1. Дешёвые checks в `validate` (параллельно).
2. `unit` после validate (stage или `needs`).
3. `docker-build` с `needs: [unit]`.
4. `deploy` с `needs: [docker-build]` + `rules` только `main`.

```yaml
scan-image:
  stage: build
  needs: [docker-build]
  script:
    - echo "trivy stub"
  allow_failure: true
```

В production `allow_failure: true` для security scan — осознанное исключение, не default.

---

## `rules` vs устаревший `only/except`

```yaml
# legacy — не используйте в новых проектах
deploy-production:
  only:
    - main
  when: manual
```

Эквивалент:

```yaml
deploy-production:
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
      when: manual
    - when: never
```

`rules` читаются сверху вниз; **первое совпадение побеждает**.

---

## Переменные pipeline (шпаргалка)

| Variable | Назначение |
|----------|------------|
| `CI_COMMIT_SHA` | immutable тег образа |
| `CI_COMMIT_REF_SLUG` | безопасное имя ветки для namespace |
| `CI_PIPELINE_SOURCE` | `push`, `merge_request_event`, `schedule` |
| `CI_REGISTRY_IMAGE` | путь образа ([03-docker-registry.md](03-docker-registry.md)) |

---

## Типичные ошибки

**Build и test параллельно.** Один stage или отсутствует `needs`.

**Два pipeline на один push в MR.** Настройте `workflow:rules` или опции GitLab для branch pipeline при открытом MR.

**`needs` на job из будущего stage.** Зависимость только на предыдущие stages.

**Deploy на каждый commit в main без manual prod.** Staging auto OK; production — `when: manual`.

**Пустой `stages:`** — jobs попадут в default `test` stage.

---

## Резюме

- **Stages** — глобальный порядок; **needs** — точечный DAG внутри и между stages.
- **workflow:rules** — не создавать pipeline на каждый push в feature без MR.
- **Fail fast** — docker build и deploy только после зелёных тестов.
- На собесе рисуйте graph: lint → unit → build → deploy.

---

## Связи

| Материал | Связь |
|----------|-------|
| [02-lab-multi-stage.md](02-lab-multi-stage.md) | практика validate → test → build stub |
| [03-docker-registry.md](03-docker-registry.md) | реальный build job |
| [09-ci-templates.md](09-ci-templates.md) | вынести `.docker-build` в template |
| [gitlab-basic/03](../gitlab-basic/03-gitlab-ci-yaml.md) | основы jobs и images |

---

## Чек-лист

- [ ] Объясняете разницу **stage order** и **`needs`**
- [ ] Можете написать `workflow:rules` «только MR и main»
- [ ] Знаете, почему docker build после unit, а не параллельно
- [ ] Понимаете `CI_PIPELINE_SOURCE` для MR pipeline
- [ ] Можете нарисовать DAG из 4 jobs на доске

Следующий урок: [02-lab-multi-stage.md](02-lab-multi-stage.md).
