# 09. `include` и CI templates

## Сценарий с работы

В компании 15 микросервисов. Каждый `.gitlab-ci.yml` — копипаста `docker-build` на 40 строк. Обновили `docker:24` → `docker:26` — правили 15 репозиториев, в трёх забыли. Platform team вводит **group-level templates**: репозиторий `platform/ci-templates`, проекты подключают через `include`. MR в template — rollout через `ref: v1.3.0`.

Intermediate: **`include`**, **hidden jobs** (`.` prefix), **`extends`** — до [10-lab-templates.md](10-lab-templates.md).

## Что вы узнаете

- Зачем DRY для CI и где хранить templates.
- Синтаксис **`include`** (project, local, remote).
- **Hidden jobs** и **`extends`**.
- Версионирование `ref` (tag vs branch).
- Ограничения и антипаттерны.

---

## Проблема копипасты

```text
service-a/.gitlab-ci.yml   ──┐
service-b/.gitlab-ci.yml   ──┼──▶ одинаковый блок docker-build
service-c/.gitlab-ci.yml   ──┘
```

Изменение (dind TLS, login, теги) — **в одном месте**. Иначе drift и «в сервисе B старый login».

Тот же паттерн для terraform jobs — см. [11-terraform-ci.md](11-terraform-ci.md) и [`aws-terraform`](../aws-terraform/README.md).

---

## `include` — подключение файлов

### Из другого проекта GitLab

```yaml
include:
  - project: "platform/ci-templates"
    ref: v1.2.0
    file:
      - "/jobs/docker-build.yml"
      - "/jobs/terraform-plan.yml"

stages:
  - test
  - build

unit:
  extends: .pytest
  stage: test
```

`project` — путь `group/subgroup/repo`. `ref` — branch, tag или SHA.

### Локальный файл

```yaml
include:
  - local: "ci/docker-build.yml"
  - local: "ci/deploy-k8s.yml"
```

Удобно для монорепо и обучения без второго GitLab-проекта.

### Remote (осторожно)

```yaml
include:
  - remote: "https://example.com/ci/base.yml"
```

Supply-chain риск — в enterprise часто запрещено.

---

## Hidden job и `extends`

Файл `ci/docker-build.yml`:

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
```

Имя с **`.`** — job не создаётся (hidden template).

```yaml
build-app:
  extends: .docker-build
  needs: [unit]
```

`extends` **мержит** ключи; дочерний переопределяет родительский.

---

## Версионирование templates

| ref | Плюс | Минус |
|-----|------|-------|
| `main` | всегда свежее | ломает без предупреждения |
| `v1.2.0` tag | воспроизводимость | нужен процесс релиза |
| commit SHA | pin навсегда | неудобно обновлять |

**Рекомендация:** semantic tag; сервисы обновляют `ref` осознанным MR.

---

## Композиция с stages и rules

Included файл не обязан объявлять `stages` — они в корне. Hidden job указывает `stage: build` — stage должен существовать.

**Важно:** `rules` в дочернем job **полностью заменяют** родительские, не мержатся.

---

## `!reference` (кратко)

```yaml
.script-docker-login:
  - docker login -u "$CI_REGISTRY_USER" -p "$CI_REGISTRY_PASSWORD" "$CI_REGISTRY"

build:
  before_script:
    - !reference [.script-docker-login]
```

Альтернатива `extends` для мелких фрагментов.

---

## Антипаттерны

**God template** на 500 строк.

**Циклический extends** — GitLab отклонит.

**Секреты в template repo** — только variables.

**include без pin ref** — внезапные поломки.

---

## Связь с Terraform и deploy

```text
platform/ci-templates/
├── jobs/
│   ├── docker-build.yml
│   ├── deploy-k8s.yml
│   └── terraform-plan.yml
```

[11-terraform-ci.md](11-terraform-ci.md) — `.terraform-plan`; [08-lab-environments.md](08-lab-environments.md) — `.deploy-base`.

---

## Типичные ошибки

**`extends` job not found`** — опечатка; неверный include path.

**Included pipeline invalid** — YAML lint в GitLab.

**Template breaking change без major tag** — нарушение контракта.

---

## Резюме

- `include` + `extends` — DRY для docker build, deploy, terraform.
- Hidden jobs (`.` prefix) — шаблоны без лишних jobs в graph.
- Pin `ref` на tag — стабильность для production сервисов.

---

## Связи

| Материал | Связь |
|----------|-------|
| [10-lab-templates.md](10-lab-templates.md) | лаба local include |
| [03-docker-registry.md](03-docker-registry.md) | содержимое template |
| [11-terraform-ci.md](11-terraform-ci.md) | terraform template |

---

## Чек-лист

- [ ] `include` project vs local vs remote
- [ ] Hidden job — зачем точка в имени
- [ ] `extends` переопределяет поля родителя
- [ ] Почему `ref: v1.0.0`, не `main`
- [ ] Secrets не в template YAML

Следующий урок: [10-lab-templates.md](10-lab-templates.md).
