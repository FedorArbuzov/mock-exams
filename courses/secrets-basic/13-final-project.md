# 13. Финальный проект: секреты сервиса checkout

## Введение: собрать basic в один контур

Отдельно вы умеете KV v2, policies, token TTL, CI tabletop и K8s auth concept. **Финал** — сценарий **checkout service** на [`deploy/vault`](../../deploy/vault/README.md): иерархия секретов `secret/course/checkout/*`, readonly policy для CI, эмуляция deploy fetch, документ **PROJECT.md** и сравнение с GitLab-only подходом.

## Что вы узнаете (итог курса)

- Спроектировать **path layout** и policies.
- Выдать **tokens** с разными правами (app-read, ci-read, admin-write dev).
- Описать **runbook** утечки token и rotation KV version.
- Сопоставить с [12-comparison-managers](12-comparison-managers.md).

## Требования

| # | Требование | Критерий |
|---|------------|----------|
| 1 | Стенд | `docker compose up -d`, `smoke.sh` OK |
| 2 | KV paths | `db`, `deploy`, `stripe` под `secret/course/checkout/` |
| 3 | Policies | `course-readonly` + `course-dev-writer` (dev prefix only) |
| 4 | Tokens | CI readonly + dev writer; TTL документирован |
| 5 | CI tabletop | fetch `deploy` → json → jq без echo key |
| 6 | K8s tabletop | role JSON + SA diagram в PROJECT.md |
| 7 | Документ | `PROJECT.md` по шаблону |
| 8 | Сравнение | 1 абзац: только GitLab masked vs Vault |

---

## Сценарий домена

**Checkout** — микросервис:

| Secret path | Ключи (пример) | Кто читает |
|-------------|----------------|------------|
| `secret/course/checkout/db` | username, password, host | app runtime |
| `secret/course/checkout/deploy` | api_key, registry_user | GitLab CI |
| `secret/course/checkout/stripe` | webhook_secret | app runtime |
| `secret/course/dev/checkout/feature` | flag_key | dev writer only |

---

## Фаза 1. Подготовка стенда

```bash
cd deploy/vault
docker compose up -d
export VAULT_ADDR=http://localhost:8200 VAULT_TOKEN=course
bash scripts/smoke.sh
```

```bash
V="docker exec -e VAULT_ADDR=http://127.0.0.1:8200 -e VAULT_TOKEN=course mock-vault vault"
```

---

## Фаза 2. Секреты и версии

```bash
$V kv put secret/course/checkout/db \
  username=checkout_app password='ProdLike-NotReal' host=postgres.prod.lab

$V kv put secret/course/checkout/deploy \
  api_key='sk-final-deploy-key' registry_user=ci-checkout env=production

$V kv put secret/course/checkout/stripe webhook_secret='whsec_lab_only'

$V kv put secret/course/dev/checkout/feature flag_key=beta-checkout-v2
```

Ротация tabletop: обновите **только** `deploy` (version 2), сохраните version 1 через `kv get -version=1`.

---

## Фаза 3. Policies

### 3.1 Readonly (из репо)

```bash
docker exec -i -e VAULT_TOKEN=course mock-vault vault policy write course-readonly - \
  < deploy/vault/examples/policy-readonly.hcl
```

Расширение: CI не должен читать `stripe` — в PROJECT.md опишите **отдельную** policy `ci-deploy-only` (создайте сами) с path только `secret/data/course/checkout/deploy`.

### 3.2 Dev writer (создайте)

Пример содержимого `course-dev-writer.hcl`:

```hcl
path "secret/data/course/dev/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
path "secret/metadata/course/dev/*" {
  capabilities = ["list", "read", "delete"]
}
```

```bash
# записать файл локально и:
docker exec -i -e VAULT_TOKEN=course mock-vault vault policy write course-dev-writer - < course-dev-writer.hcl
```

---

## Фаза 4. Tokens

```bash
$V token create -policy=course-readonly -ttl=30m -display-name=final-ci
$V token create -policy=course-dev-writer -ttl=2h -display-name=final-dev
```

Проверки:

- CI token: `kv get deploy` OK, `kv put deploy` denied.
- Dev token: `kv put secret/course/dev/checkout/feature flag_key=v3` OK.
- Dev token: `kv get secret/course/checkout/db` denied (если policy только dev prefix).

---

## Фаза 5. CI tabletop

Повторите [09-lab-ci](09-lab-ci.md) с production-like значениями; приложите в PROJECT.md:

- размер artifact (без содержимого key);
- команда `jq` для проверки `env=production`;
- `vault token revoke -self` в конце.

Ссылка на snippet: [`examples/gitlab-vault-snippet.yml`](examples/gitlab-vault-snippet.yml).

---

## Фаза 6. Kubernetes tabletop

В PROJECT.md:

1. Диаграмма: namespace `checkout`, SA `checkout-app`.
2. Таблица mapping на [`examples/k8s-auth-role.json`](examples/k8s-auth-role.json).
3. Какие secrets монтирует Pod (db, stripe) — **не** deploy key.

---

## Фаза 7. Runbook (шаблон)

В `PROJECT.md` секция **Runbook: утёк CI token**:

1. **Симптом:** неизвестный `kv get` в audit / подозрительный pipeline.
2. **Немедленно:** `vault token revoke <accessor>`.
3. **Rotate:** `kv put` deploy version N+1; инвалидировать старый api_key у registry.
4. **Root cause:** variable scope, protected branch, OIDC migration plan.
5. **Эскалация:** список accessors `vault list auth/token/accessors`.

---

## Шаблон PROJECT.md

```markdown
# Secrets Basic — Final Project

## Автор / дата

## Стенд
- deploy/vault, mock-vault
- VAULT_ADDR, token course (lab only)

## Path layout
- secret/course/checkout/…
- secret/course/dev/…

## Policies
- course-readonly (paths)
- course-dev-writer (paths)
- ci-deploy-only (если создавали)

## Tokens
| name | policies | ttl | проверки |

## Rotation
- deploy v1 → v2, команды

## CI tabletop
- fetch artifact, jq, revoke

## K8s auth
- SA, role bindings, diagram

## Runbook
- утёк CI token

## Comparison
- GitLab masked only vs Vault (1 абзац)

## Выводы
- 3 bullets
```

---

## Критерии оценки (самопроверка)

- [ ] Три prod-like секрета checkout + dev feature secret
- [ ] Policies загружены; dev writer не пишет в `checkout/` prod paths
- [ ] CI и dev tokens проверены негативными тестами
- [ ] Deploy secret rotated (2 versions)
- [ ] PROJECT.md полный без вставки реальных «prod» паролей в публичный fork
- [ ] Ссылка на [`deploy/vault/README.md`](../../deploy/vault/README.md)

## Дальше

- [`secrets-advanced`](../secrets-advanced/README.md) — PKI, Transit, dynamic DB
- [gitlab-advanced/07-oidc-cloud](../gitlab-advanced/07-oidc-cloud.md) — JWT auth
- [aws-intermediate/11](../aws-intermediate/11-secrets-kms.md) — SM + KMS
- [kuber-basic/12](../kuber-basic/12-config-and-secret.md) — ConfigMap vs Secret

Поздравляем с завершением **Secrets — Basic**.
