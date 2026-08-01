# 14. Migrations in GitLab CI

## Scenario

Merge to `main` — pipeline green, deploy succeeded, prod fails: `column promo_code does not exist`. Migrations ran **after** the app deploy. Or two pipelines applied Flyway in parallel — the second failed, but the first was already half-deployed.

Correct pipeline: **test → migrate → deploy**; migrate job with a DDL role; `flyway validate` on every MR.

**Related:** [gitlab-intermediate](../gitlab-intermediate/README.md), [gitlab-advanced](../gitlab-advanced/README.md), [security/14](../postgresql-security/14-final-project.md).

## What you'll learn

- Order of migrate vs deploy
- Migrate job in GitLab CI
- Secrets and DDL role
- Kubernetes hooks

## Principles

```text
build → unit test → integration test (testcontainers)
     → flyway validate (MR)
     → flyway migrate (main, staging)
     → deploy app
```

| Rule | Why |
|---------|--------|
| Migrate **before** deploy (expand) | New app expects the new schema |
| Migrate **after** deploy (contract) | Only DROP old column |
| One migrate runner | No race on flyway_schema_history |
| validate on MR | Checksum before merge |
| Secrets in CI vars | Not in git |

### Expand/contract in the pipeline

```text
Release 1: migrate V4 (ADD nullable column) → deploy app v2
Release 2: migrate V5 (DROP old column)     → deploy app v3 (does not use old)
```

You cannot V5 DROP before all pods are app v2.

## GitLab CI example

See [`examples/gitlab-migrate.yml`](examples/gitlab-migrate.yml):

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

## Postgres in CI

| Option | When |
|---------|-------|
| `services: postgres:16` | Unit/integration |
| Testcontainers | [python-testing](../python-testing/README.md) |
| Shared staging DB | migrate stage only, not parallel |

Isolated DB per pipeline — ideal.

## Secrets

```yaml
variables:
  DB_PASSWORD:
    description: "Migrator password"
```

GitLab masked + protected. Role `shop_migrator` — not superuser.

See [secrets-basic](../secrets-basic/README.md).

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

Argo CD: PreSync hook. **Do not** migrate from app Deployment startup.

## Failed migration

| State | Action |
|-----------|----------|
| flyway_schema_history success=false | Blocks migrate |
| Fix SQL | New commit — **do not** edit applied |
| Dev | `flyway repair` or reset DB |
| Prod | Forward fix migration, DBA runbook |

Rolling back the app **does not** roll back the schema — PITR last resort ([ops](../postgresql-ops/README.md)).

## Common mistakes

1. `flyway migrate` in the app Dockerfile ENTRYPOINT.
2. Password in `flyway.conf` in the repo.
3. Parallel deploy + migrate without a lock.
4. validate only on main — checksum surprise after merge.
5. migrate on prod from a laptop.

## Checklist

- [ ] migrate before deploy (expand)
- [ ] validate on MR
- [ ] Secrets in CI variables
- [ ] DDL role separate from app
- [ ] Failed migration runbook

## Next

Final project: [15-final-project.md](15-final-project.md).
