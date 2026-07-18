# 14. Миграции в GitLab CI

## Сценарий с работы

Merge в `main` — pipeline зелёный, deploy прошёл, prod падает: `column promo_code does not exist`. Миграции запускались **после** deploy app. Или два pipeline параллельно применили Flyway дважды — второй failed, но первый уже half-deployed.

Правильный pipeline: **test → migrate → deploy**; migrate job с DDL-ролью; `flyway validate` на каждый MR.

**Связь:** [gitlab-intermediate](../gitlab-intermediate/README.md), [gitlab-advanced](../gitlab-advanced/README.md), [security/14](../postgresql-security/14-final-project.md).

## Что вы узнаете

- Порядок migrate vs deploy
- Job migrate в GitLab CI
- Secrets и DDL role
- Kubernetes hooks

## Принципы

```text
build → unit test → integration test (testcontainers)
     → flyway validate (MR)
     → flyway migrate (main, staging)
     → deploy app
```

| Правило | Почему |
|---------|--------|
| Migrate **до** deploy (expand) | Новый app ожидает новую схему |
| Migrate **после** deploy (contract) | Только DROP old column |
| Один migrate runner | Нет race на flyway_schema_history |
| validate на MR | Checksum до merge |
| Secrets в CI vars | Не в git |

### Expand/contract в pipeline

```text
Release 1: migrate V4 (ADD nullable column) → deploy app v2
Release 2: migrate V5 (DROP old column)     → deploy app v3 (не использует old)
```

Нельзя V5 DROP до того как все pods app v2.

## Пример GitLab CI

См. [`examples/gitlab-migrate.yml`](examples/gitlab-migrate.yml):

```yaml
migrate:
  stage: deploy
  image: flyway/flyway:10
  services:
    - name: postgres:16
      alias: postgres
  variables:
    FLYWAY_URL: jdbc:postgresql://postgres:5432/course
    FLYWAY_USER: course
    FLYWAY_PASSWORD: $DB_PASSWORD  # masked CI variable
    FLYWAY_SCHEMAS: devapp
    FLYWAY_LOCATIONS: filesystem:sql
  script:
    - flyway info
    - flyway validate
    - flyway migrate
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
```

### MR pipeline — validate only

```yaml
flyway-validate:
  stage: test
  image: flyway/flyway:10
  script:
    - flyway validate
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

## Postgres в CI

| Вариант | Когда |
|---------|-------|
| `services: postgres:16` | Unit/integration |
| Testcontainers | [python-testing](../python-testing/README.md) |
| Shared staging DB | Только migrate stage, не parallel |

Изолированная БД per pipeline — идеал.

## Secrets

```yaml
variables:
  DB_PASSWORD:
    description: "Migrator password"
```

GitLab masked + protected. Роль `shop_migrator` — не superuser.

См. [secrets-basic](../secrets-basic/README.md).

## Kubernetes / Helm

```yaml
# pre-install / pre-upgrade hook
apiVersion: batch/v1
kind: Job
metadata:
  annotations:
    helm.sh/hook: pre-upgrade
spec:
  template:
    spec:
      containers:
        - name: flyway
          image: flyway/flyway:10
          command: ["flyway", "migrate"]
```

Argo CD: PreSync hook. **Не** migrate из app Deployment startup.

## Failed migration

| Состояние | Действие |
|-----------|----------|
| flyway_schema_history success=false | Блокирует migrate |
| Fix SQL | Новый commit — **не** править applied |
| Dev | `flyway repair` или reset DB |
| Prod | Forward fix migration, DBA runbook |

Откат app **не** откатывает схему — PITR last resort ([ops](../postgresql-ops/README.md)).

## Типичные ошибки

1. `flyway migrate` в Dockerfile ENTRYPOINT app.
2. Пароль в `flyway.conf` в repo.
3. Parallel deploy + migrate без lock.
4. validate только на main — checksum сюрприз после merge.
5. migrate на prod из laptop.

## Чек-лист

- [ ] migrate before deploy (expand)
- [ ] validate on MR
- [ ] Secrets in CI variables
- [ ] DDL role отдельно от app
- [ ] Failed migration runbook

## Дальше

Финальный проект: [15-final-project.md](15-final-project.md).
