# 07. Dynamic secrets и AppRole

## Введение: «Один пароль БД на 200 микросервисов»

Shared credential `app_user` / `s3cr3t` в [tfvars](../aws-intermediate/12-lab-secrets-kms.md) когда-то попал в Slack. Смена пароля — **координационный кошмар**. **Dynamic secrets** выдают **уникальные** учётные данные на lease; **AppRole** — machine-to-machine auth без human login.

## Что вы узнаете

- Database / AWS / PKI **dynamic** engines (обзор).
- **AppRole**: `role_id` + `secret_id` → token.
- Delivery `secret_id`, wrapping, TTL.
- Связь с CI ([gitlab-basic/07](../gitlab-basic/07-variables-secrets.md)).

---

## Dynamic secrets (модель)

```mermaid
sequenceDiagram
  participant App as Application
  participant V as Vault
  participant DB as Database
  App->>V: login + request creds
  V->>DB: CREATE USER ... PASSWORD ...
  V-->>App: username/password + lease
  Note over V,DB: lease expiry → DROP USER
```

| Engine | Выдаёт |
|--------|--------|
| `database` | SQL user/password |
| `aws` | IAM access key (legacy) или STS |
| `pki` | cert + key (short-lived) |
| `ssh` | OTP / signed key |

Vault хранит **admin connection** к БД; приложение получает **временного** пользователя.

Пример (концепт, на стенде БД нет):

```bash
vault write database/config/mydb \
  plugin_name=postgresql-database-plugin \
  connection_url="postgresql://{{username}}:{{password}}@postgres:5432/mydb" \
  allowed_roles="readonly"

vault write database/roles/readonly \
  db_name=mydb \
  creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}';" \
  default_ttl=1h
```

---

## AppRole: зачем

| Метод | Кто использует |
|-------|----------------|
| Userpass / OIDC | Люди |
| Kubernetes auth | Pods с SA JWT |
| **AppRole** | CI, VM без K8s, legacy batch |

Два фактора machine auth:

1. **role_id** — похож на username (менее секретен, но не публикуйте в git)
2. **secret_id** — одноразовый/ротируемый секрет доставки

```bash
vault auth enable approle

vault write auth/approle/role/ci-deploy \
  token_policies="lab-transit-encrypt" \
  token_ttl=15m \
  token_max_ttl=1h \
  secret_id_ttl=10m \
  secret_id_num_uses=1

vault read auth/approle/role/ci-deploy/role-id
vault write -f auth/approle/role/ci-deploy/secret-id
```

Login:

```bash
vault write auth/approle/login \
  role_id="<role_id>" \
  secret_id="<secret_id>"
```

Ответ — **client token** с ограниченной policy.

---

## Доставка secret_id

| Способ | Комментарий |
|--------|-------------|
| CI masked variable | Минимум для курса |
| **Response wrapping** | `vault write -wrap-ttl=120s ...` — одноразовый токен |
| Vault Agent | Файл на VM с правами 600 |
| Cloud metadata | Осторожно с SSRF |

Никогда: secret_id в открытом логе pipeline ([linux-security/07](../linux-security/07-secrets-disk.md) — history, artifacts).

---

## secret_id constraints

| Параметр | Смысл |
|----------|--------|
| `secret_id_num_uses` | Сколько login |
| `secret_id_ttl` | Время жизни |
| `bind_secret_id` | false — только для особых случаев |
| `token_bound_cidrs` | IP allowlist |

**На собеседовании:** «AppRole vs K8s auth?» — в кластере предпочтительнее **Kubernetes auth** + projected SA; AppRole — CI вне кластера.

---

## Token lifecycle

После login:

```bash
vault token lookup
vault token renew <token>    # если renewable
vault token revoke <token>   # при компрометации
```

Periodic tokens и **orphan** — тема [09-ha-raft-unseal](09-ha-raft-unseal.md) и [10-troubleshooting-audit](10-troubleshooting-audit.md).

---

## Anti-patterns

| Плохо | Лучше |
|-------|-------|
| Root token в `VAULT_TOKEN` CI | AppRole + минимальная policy |
| `secret_id_num_uses=0` unlimited | Ограничить uses и TTL |
| Один AppRole на все env | role per env: `ci-deploy-prod` |
| Static DB password в KV «на всякий случай» | Только dynamic |

---

## Резюме

- Dynamic secrets — **короткоживущие** учётные данные с автоотзывом.
- AppRole — **M2M** для CI/VM; защищайте secret_id.
- Следующий шаг: [08. Лаба: AppRole](08-lab-approle.md).
