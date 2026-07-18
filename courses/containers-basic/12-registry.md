# 12. Registry: tag, push, pull

## Введение: «образ есть только на моём ноутбуке»

CI собрал `myapp:abc123`, но staging тянет **старый latest** с другой машины. Нужен **registry** — HTTP API хранения образов по **digest** и **тегам**. Локально для лаб — **registry:2** на `localhost:5000`; в компании — GitLab Container Registry ([`gitlab-intermediate/03-docker-registry`](../gitlab-intermediate/03-docker-registry.md)), ECR, Harbor.

## Что вы узнаете

- Именование **`registry/репозиторий:тег`**.
- Команды **tag**, **push**, **pull**.
- Локальный registry в [`docker-compose.registry.yml`](../../deploy/containers/docker-compose.registry.yml).
- **Insecure registry** только для учебного localhost.

## Имя образа

```text
localhost:5000/course/api:1.0.0
│          │      │    └── tag (mutable)
│          │      └── repository (often project/app)
│          └── registry host:port
```

| Часть | Пример |
|-------|--------|
| Registry | `registry.gitlab.com`, `123.dkr.ecr...amazonaws.com` |
| Repository | `group/project/api` |
| Tag | `sha-abc`, `1.2.3`, `latest` |

**Digest** `sha256:…` — неизменяемая ссылка; тег может указывать на другой digest после перезаписи.

## Workflow DevOps

```mermaid
sequenceDiagram
  participant Dev as Dockerfile
  participant CI as docker build
  participant Reg as Registry
  participant Run as compose/k8s
  Dev --> CI
  CI --> Reg: push tag
  Run --> Reg: pull tag
```

1. `docker build -t myapp:dev .`
2. `docker tag myapp:dev localhost:5000/myapp:dev`
3. `docker push localhost:5000/myapp:dev`
4. На другой машине: `docker pull …` и `image: localhost:5000/myapp:dev` в compose.

## Локальный registry на стенде

```bash
cd deploy/containers
docker compose -f docker-compose.yml -f docker-compose.registry.yml up -d
```

Сервис **`mock-registry`**, порт **5000**, volume `registry-data` для blobs.

Проверка:

```bash
curl -s http://localhost:5000/v2/_catalog
```

## Insecure registry (только лаб)

`localhost:5000` без TLS — Docker по умолчанию **отклоняет push**. Docker Desktop:

**Settings → Docker Engine:**

```json
"insecure-registries": ["localhost:5000"]
```

На Linux — `/etc/docker/daemon.json`. **Не** используйте insecure для публичных registry.

## Аутентификация (обзор)

| Registry | Логин |
|----------|--------|
| GitLab CI | `CI_REGISTRY_USER` / `CI_JOB_TOKEN` |
| ECR | `aws ecr get-login-password` |
| Harbor | robot account |

Локальный registry:2 в лабе — **без auth** (только localhost).

## Связь с GitLab CI

Фрагмент из [03-docker-registry](../gitlab-intermediate/03-docker-registry.md):

```yaml
- docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
- docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
- docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
```

Тот же паттерн, что `tag` + `push` на `localhost:5000`.

## Типичные ошибки

| Ошибка | Симптом | Исправление |
|--------|---------|-------------|
| Push без tag на registry host | denied / http/https | полное имя `host/repo:tag` |
| Забыть `docker tag` | push wrong image | явный tag |
| `:latest` в prod без pin | неожиданный rollback | SHA или semver |
| Insecure на реальном IP | MITM | TLS + certs |
| Огромный образ | slow push | multistage, slim base |

## В продакшене

- **Immutable tags**: не перезаписывать релизные теги.
- **Retention policy** — чистка старых слоёв.
- **Signing** (cosign), **scan** перед push ([14-security](14-security.md)).
- Geo-replication registry для DR.
- K8s `imagePullSecrets` для private registry.

## Заметки для собеседования

- Registry хранит **layers**; один слой общий между образами.
- `docker manifest inspect` — multi-arch (arm/amd).
- Pull policy в K8s: `IfNotPresent` / `Always`.

## Резюме

Registry — **центр доставки образов** между CI, staging и prod. Локальный `localhost:5000` повторяет tag/push/pull без облака. Следующая лаба — запушить образ api со стенда.

## Чек-лист

- Из чего состоит полное имя образа?
- Зачем `insecure-registries` на Desktop?
- Где в репозитории overlay registry?
- Как GitLab CI пушит образ?

Следующий урок: [13. Лаба: registry](13-lab-registry.md).
