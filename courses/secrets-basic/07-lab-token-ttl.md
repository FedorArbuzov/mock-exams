# 07. Лаба: TTL, renew и revoke токена

## Цель лабы

Создать token с коротким **TTL**, проверить `token lookup`, выполнить **renew**, затем **revoke** и убедиться, что `kv get` больше не работает.

## Предварительно

- Policy `course-readonly` из [лабы 05](05-lab-policies.md).
- Секрет `secret/course/checkout/db` на месте.

```bash
V="docker exec -e VAULT_ADDR=http://127.0.0.1:8200 -e VAULT_TOKEN=course mock-vault vault"
```

---

## Задание 1. Token с TTL 5 минут

```bash
$V token create -policy=course-readonly -ttl=5m -renewable=true \
  -display-name=lab-ttl -format=json > /tmp/vault-token.json
```

Извлеките token (jq или вручную из JSON):

```bash
# Git Bash / WSL:
export LAB_TOKEN=$(grep -o '"client_token": "[^"]*"' /tmp/vault-token.json | cut -d'"' -f4)
```

PowerShell: скопируйте `client_token` в `$env:LAB_TOKEN`.

---

## Задание 2. Lookup

```bash
docker exec -e VAULT_TOKEN="$LAB_TOKEN" mock-vault vault token lookup
```

**Что увидите:** `ttl` около 300s, `renewable: true`, policies содержит `course-readonly`.

---

## Задание 3. Доступ к KV

```bash
docker exec -e VAULT_TOKEN="$LAB_TOKEN" mock-vault \
  vault kv get -field=username secret/course/checkout/db
```

**Что увидите:** `checkout_app`.

---

## Задание 4. Renew

```bash
docker exec -e VAULT_TOKEN="$LAB_TOKEN" mock-vault vault token renew
docker exec -e VAULT_TOKEN="$LAB_TOKEN" mock-vault vault token lookup | grep ttl
```

**Что увидите:** `ttl` снова близок к 5m (сброс lease).

---

## Задание 5. Revoke

```bash
docker exec -e VAULT_TOKEN="$LAB_TOKEN" mock-vault vault token revoke -self
```

**Что увидите:** `success! revoked`.

---

## Задание 6. Доступ после revoke

```bash
docker exec -e VAULT_TOKEN="$LAB_TOKEN" mock-vault \
  vault kv get secret/course/checkout/db || true
```

**Что увидите:** `permission denied` или invalid token.

---

## Задание 7. Tabletop: CI job end (опционально)

Опишите в 3 предложениях в блокноте: почему deploy job должен вызывать `vault token revoke -self` в `after_script`, даже если deploy упал.

---

## Критерии успеха

- [ ] Token создан с `-ttl=5m` и policy readonly
- [ ] `lookup` показывает ttl и renewable
- [ ] `kv get` до revoke работает
- [ ] `renew` увеличивает ttl
- [ ] После `revoke -self` get не работает

## Что унести в работу

- Короткий TTL + renew Agent/sidecar в prod
- Revoke при завершении CI снижает окно утечки
- Не хранить child token в artifact без шифрования

Следующий урок: [08. GitLab CI и Vault](08-ci-gitlab-vault.md).
