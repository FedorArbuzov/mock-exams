# 08. Лаба: AppRole для CI

## Цель лабы

Включить **AppRole**, выдать token с ограниченной policy (чтение KV), симулировать **CI job** без root token `course`.

## Предварительно

- [07. Dynamic secrets и AppRole](07-dynamic-secrets-approle.md)
- [secrets-basic](../secrets-basic/README.md) — KV `secret/` (если проходили; иначе создайте путь ниже)

```bash
export VAULT_ADDR=http://localhost:8200
export VAULT_TOKEN=course
vault secrets enable -path=secret kv-v2 2>/dev/null || true
vault kv put secret/course/ci-demo value="deploy-ok"
```

---

## Задание 1. Policy только на CI path

```hcl
# /tmp/vault-approle-lab/ci-read.hcl
path "secret/data/course/ci-demo" {
  capabilities = ["read"]
}
```

```bash
vault policy write ci-read /tmp/vault-approle-lab/ci-read.hcl
```

---

## Задание 2. AppRole

```bash
vault auth enable approle 2>/dev/null || true

vault write auth/approle/role/ci-lab \
  token_policies="ci-read" \
  token_ttl=10m \
  token_max_ttl=30m \
  secret_id_ttl=5m \
  secret_id_num_uses=2

ROLE_ID=$(vault read -field=role_id auth/approle/role/ci-lab/role-id)
SECRET_ID=$(vault write -field=secret_id -f auth/approle/role/ci-lab/secret-id)

echo "ROLE_ID=$ROLE_ID"
echo "SECRET_ID=$SECRET_ID (не коммитьте)"
```

---

## Задание 3. Login как CI

```bash
CI_TOKEN=$(vault write -field=token auth/approle/login \
  role_id="$ROLE_ID" \
  secret_id="$SECRET_ID")

VAULT_TOKEN=$CI_TOKEN vault kv get secret/course/ci-demo
VAULT_TOKEN=$CI_TOKEN vault kv put secret/course/forbidden hack=1
```

**Ожидание:** get OK, put **permission denied**.

```bash
VAULT_TOKEN=$CI_TOKEN vault token lookup
```

---

## Задание 4. Response wrapping (опционально)

```bash
WRAPPED=$(vault write -field=wrapping_token -wrap-ttl=60s \
  -f auth/approle/role/ci-lab/secret-id)

vault unwrap "$WRAPPED"
```

**Зачем:** secret_id не светится в логе CI напрямую — unwrap одноразовый.

---

## Задание 5. Исчерпание secret_id

Повторите login дважды с **тем же** secret_id (если `secret_id_num_uses=2`):

```bash
vault write auth/approle/login role_id="$ROLE_ID" secret_id="$SECRET_ID"
vault write auth/approle/login role_id="$ROLE_ID" secret_id="$SECRET_ID"
vault write auth/approle/login role_id="$ROLE_ID" secret_id="$SECRET_ID"
```

**Ожидание:** третий вызов — ошибка uses exceeded. Объясните, как CI должен **запрашивать новый** secret_id каждый job.

---

## Сравнение с GitLab variables

В README заметки: чем **masked GitLab variable** ([07-variables-secrets](../gitlab-basic/07-variables-secrets.md)) слабее AppRole + Vault для **ротации** и **audit**.

---

## Критерии успеха

- [ ] CI token читает только `secret/course/ci-demo`
- [ ] Root не нужен для job
- [ ] Понимаете role_id vs secret_id
- [ ] (опционально) wrapping или uses limit продемонстрированы

Следующий урок: [09. HA, Raft, unseal](09-ha-raft-unseal.md).
