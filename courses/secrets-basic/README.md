# Secrets — Basic (HashiCorp Vault)

Базовый уровень: **зачем менеджер секретов**, **архитектура Vault**, **KV v2**, **политики ACL**, **auth methods и TTL токенов**, **GitLab CI + Vault**, **Kubernetes auth (концепт)**, **сравнение с AWS SM / GitLab masked / env**, **мини-проект «секреты сервиса checkout»**.

**Предварительно:** Linux и Docker ([`linux-basic`](../linux-basic/README.md) — `docker compose`, `export`, терминал). Полезно: [gitlab-basic/07](../gitlab-basic/07-variables-secrets.md), [kuber-basic/12](../kuber-basic/12-config-and-secret.md), [aws-intermediate/11](../aws-intermediate/11-secrets-kms.md).

**Локально:** [`deploy/vault`](../../deploy/vault/README.md) — `docker compose up -d`, с хоста:

| Параметр | Значение |
|----------|----------|
| API / UI | [http://localhost:8200](http://localhost:8200) · UI: `/ui` |
| Root token (только лаб) | `course` |
| Контейнер | `mock-vault` |

```bash
export VAULT_ADDR=http://localhost:8200
export VAULT_TOKEN=course
# или без локального vault CLI:
docker exec -e VAULT_TOKEN=course mock-vault vault status
```

Smoke: `bash scripts/smoke.sh` в `deploy/vault`. Сниппеты: [`examples/gitlab-vault-snippet.yml`](examples/gitlab-vault-snippet.yml), [`examples/k8s-auth-role.json`](examples/k8s-auth-role.json).

**Дальше:** [`secrets-advanced`](../secrets-advanced/README.md) (PKI, Transit, dynamic DB). Связи: [gitlab-advanced/07-oidc-cloud](../gitlab-advanced/07-oidc-cloud.md), [kafka-intermediate/19](../kafka-intermediate/19-security-basics.md).

## Как читать главы

Каждый урок — **глава книги**, не шпаргалка. Рекомендуемый порядок внутри пары:

1. Прочитайте **теорию** (01, 02, 04…) — не пропускайте «типичные ошибки».
2. Откройте **лабу** (03, 05…) с поднятым стендом `docker compose up -d` в `deploy/vault`.
3. Выполняйте задания **по номерам**; сверяйте вывод с блоком «что увидите».
4. Если API не отвечает — [`deploy/vault/README.md`](../../deploy/vault/README.md) (healthcheck, `VAULT_TOKEN`, dev mode).

**Структура теории:** введение (сценарий с работы) → что узнаете → концепции → пример на стенде → ошибки → в проде → резюме → чек-лист.

**Структура лабы:** цель → предварительно → задания 1…N (зачем / команды / что увидите) → критерии успеха.

**Время:** около **40–50 минут** на пару «теория + лаба»; [финальный проект](13-final-project.md) — **2–3 часа**.

**Шпаргалка подключения:**

| Откуда | Адрес / команда |
|--------|-----------------|
| API с хоста | `VAULT_ADDR=http://localhost:8200` |
| Token (lab) | `VAULT_TOKEN=course` |
| UI login | Method **Token**, value `course` |
| CLI в контейнере | `docker exec -e VAULT_TOKEN=course mock-vault vault …` |
| KV mount (после smoke) | `secret/` (engine **kv-v2**) |

## Программа

### Основы (01–03)

1. [Зачем секреты: static vs dynamic, экосистема](01-why-secrets.md)
2. [Архитектура Vault: seal, engines, paths](02-vault-architecture.md)
3. [Лаба: KV v2 — put, get, версии](03-lab-kv-v2.md)

### Политики (04–05)

4. [Политики ACL: path, capabilities](04-policies-acl.md) · 5. [Лаба: readonly policy](05-lab-policies.md)

### Auth (06–07)

6. [Auth methods: token, AppRole, K8s (обзор)](06-auth-methods.md) · 7. [Лаба: token, TTL, revoke](07-lab-token-ttl.md)

### CI (08–09)

8. [GitLab CI и Vault: переменные, KV для deploy](08-ci-gitlab-vault.md) · 9. [Лаба: tabletop CI + secret](09-lab-ci.md)

### Kubernetes (10–11)

10. [Vault и Kubernetes: Secret vs Vault, auth](10-kubernetes-vault.md) · 11. [Лаба: K8s auth (tabletop + mockctl)](11-lab-k8s-auth.md)

### Сравнение и финал (12–13)

12. [Сравнение менеджеров секретов](12-comparison-managers.md)
13. [Финальный проект: checkout service secrets](13-final-project.md)

## Что должно получиться

- Объясняете **static vs dynamic** секреты и когда нужен Vault.
- Работаете с **KV v2** (`secret/data/…`, metadata, версии).
- Пишете **policy** least privilege и проверяете от имени ограниченного токена.
- Понимаете **auth method**, **token TTL** и **revoke**.
- Описываете поток **GitLab CI → Vault KV → deploy secret** (tabletop).
- Объясняете **Kubernetes auth** и связь с [kuber-basic/12](../kuber-basic/12-config-and-secret.md).
- Сравниваете Vault с **AWS Secrets Manager**, **GitLab masked**, **.env в репо**.

## Примеры

| Путь | Назначение |
|------|------------|
| [`examples/gitlab-vault-snippet.yml`](examples/gitlab-vault-snippet.yml) | фрагмент `.gitlab-ci.yml` + Vault KV |
| [`examples/k8s-auth-role.json`](examples/k8s-auth-role.json) | роль Kubernetes auth (справочник) |
| [`deploy/vault/examples/policy-readonly.hcl`](../../deploy/vault/examples/policy-readonly.hcl) | политика для лабы 05 |
