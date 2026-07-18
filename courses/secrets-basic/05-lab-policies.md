# 05. Лаба: политика readonly и токен с ограниченными правами

## Цель лабы

Загрузить policy из [`deploy/vault/examples/policy-readonly.hcl`](../../deploy/vault/examples/policy-readonly.hcl), выдать **ограниченный token**, убедиться что read работает, а `kv put` и доступ вне `course/*` — **403**.

## Предварительно

- Стенд Vault up, выполнена [лаба 03](03-lab-kv-v2.md) (`secret/course/checkout/db` существует).
- Root: `VAULT_TOKEN=course`.

```bash
V="docker exec -e VAULT_ADDR=http://127.0.0.1:8200 -e VAULT_TOKEN=course mock-vault vault"
```

---

## Задание 1. Записать policy

**Зачем:** policy as file — воспроизводимый артефакт.

Из хоста (Git Bash / WSL), из корня репо:

```bash
docker exec -i -e VAULT_TOKEN=course mock-vault vault policy write course-readonly - \
  < deploy/vault/examples/policy-readonly.hcl
```

Проверка:

```bash
$V policy read course-readonly
```

**Что увидите:** два блока `path` с `read`, `list`.

---

## Задание 2. Создать ограниченный token

```bash
$V token create -policy=course-readonly -ttl=30m -display-name=lab-readonly -format=json \
  | grep -E '"client_token"|"accessor"'
```

Сохраните `client_token` в переменную (пример):

```bash
READONLY_TOKEN="<вставьте client_token>"
```

---

## Задание 3. Read разрешён

```bash
docker exec -e VAULT_TOKEN="$READONLY_TOKEN" mock-vault \
  vault kv get secret/course/checkout/db
```

**Что увидите:** успешный get username/password.

---

## Задание 4. Write запрещён

```bash
docker exec -e VAULT_TOKEN="$READONLY_TOKEN" mock-vault \
  vault kv put secret/course/checkout/db password=hacked || true
```

**Что увидите:** `permission denied` (exit code ≠ 0).

---

## Задание 5. Path вне course запрещён

С root создайте секрет вне prefix (если ещё нет):

```bash
$V kv put secret/other/secret value=1
```

С readonly:

```bash
docker exec -e VAULT_TOKEN="$READONLY_TOKEN" mock-vault \
  vault kv get secret/other/secret || true
```

**Что увидите:** permission denied.

---

## Задание 6. Capabilities (опционально)

```bash
$V token capabilities "$READONLY_TOKEN" secret/data/course/checkout/db
```

**Что увидите:** `read`, `list` (без `create`, `update`, `delete`).

---

## Задание 7. UI с readonly token (опционально)

1. Logout в UI → Login Token → вставьте `READONLY_TOKEN`.
2. Откройте `secret/course/checkout/db` — read OK.
3. Попробуйте **Create new version** — ошибка доступа.

---

## Критерии успеха

- [ ] Policy `course-readonly` загружена из examples
- [ ] Token с единственной policy `course-readonly` создан
- [ ] `kv get` на `secret/course/checkout/db` успешен
- [ ] `kv put` с readonly token — denied
- [ ] `secret/other/secret` недоступен readonly

## Что унести в работу

- CI должен использовать **token/role**, не root
- Policy файл в репо → review в MR
- Проверка: `token capabilities` перед выдачей в prod

Следующий урок: [06. Auth methods](06-auth-methods.md).
