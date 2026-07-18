# 03. Лаба: KV v2 — put, get, версии и metadata

## Цель лабы

Поднять стенд Vault, включить **KV v2** на `secret/`, записать секреты сервиса `checkout`, прочитать поля, обновить версию, посмотреть **metadata** и удалить/восстановить версию (опционально).

## Предварительно

- Docker, порт **8200** свободен.
- Из корня репозитория:

```bash
cd deploy/vault
docker compose up -d
docker compose ps
export VAULT_ADDR=http://localhost:8200
export VAULT_TOKEN=course
bash scripts/smoke.sh
```

Теория: [02. Архитектура Vault](02-vault-architecture.md).

**CLI:** локальный `vault` или префикс:

```bash
V="docker exec -e VAULT_ADDR=http://127.0.0.1:8200 -e VAULT_TOKEN=course mock-vault vault"
```

---

## Задание 1. Status и mount

**Зачем:** убедиться, что unsealed и engine доступен.

```bash
$V status
$V secrets list
```

**Что увидите:** `Sealed: false`; в списке `secret/` type `kv`, options `version:2` (после smoke).

Если `secret/` нет:

```bash
$V secrets enable -path=secret kv-v2
```

---

## Задание 2. Записать секрет checkout

**Зачем:** освоить `kv put` и path convention `course/…`.

```bash
$V kv put secret/course/checkout/db \
  username=checkout_app password='LabOnly-ChangeMe' host=postgres.lab

$V kv get secret/course/checkout/db
```

**Что увидите:** таблица key/value; `password` отображается (в UI можно скрыть — в CLI виден).

---

## Задание 3. Поле через `-field`

```bash
$V kv get -field=username secret/course/checkout/db
$V kv get -format=json secret/course/checkout/db | head -20
```

**Что увидите:** `checkout_app`; JSON с блоками `data.data` и `data.metadata`.

---

## Задание 4. Вторая версия (rotation tabletop)

**Зачем:** KV v2 сохраняет историю версий.

```bash
$V kv put secret/course/checkout/db \
  username=checkout_app password='LabOnly-Rotated-v2' host=postgres.lab

$V kv get secret/course/checkout/db
$V kv metadata get secret/course/checkout/db
```

**Что увидите:** `version` увеличилась; metadata показывает `versions` map с `created_time`.

---

## Задание 5. Прочитать старую версию

```bash
$V kv get -version=1 secret/course/checkout/db
```

**Что увидите:** password `LabOnly-ChangeMe` (версия 1).

---

## Задание 6. UI

1. [http://localhost:8200/ui](http://localhost:8200/ui) — Token `course`.
2. **Secrets** → `secret` → `course/checkout/db`.
3. Вкладка **Version History**.

---

## Задание 7. Patch (опционально)

```bash
$V kv patch secret/course/checkout/db host=postgres-vip.lab
$V kv get -field=host secret/course/checkout/db
```

**Что увидите:** host обновился без перезаписи всех ключей (новая версия).

---

## Задание 8. Soft-delete версии (опционально)

```bash
$V kv delete -versions=1 secret/course/checkout/db
$V kv metadata get secret/course/checkout/db
```

**Что увидите:** версия 1 помечена deleted; `kv get -version=1` — ошибка.

Восстановление:

```bash
$V kv undelete -versions=1 secret/course/checkout/db
```

---

## Критерии успеха

- [ ] `vault status` — unsealed
- [ ] Mount `secret/` kv-v2
- [ ] Секрет `secret/course/checkout/db` создан, get работает
- [ ] Две версии password; `metadata get` показывает обе
- [ ] `-version=1` читает старое значение
- [ ] В UI видна history

## Что унести в работу

- Путь логики: **`secret/course/<service>/<name>`**
- Ротация static secret = **новая версия KV**, не правка Git
- Policy пишут на `secret/data/...` (следующая лаба)

Следующий урок: [04. Политики ACL](04-policies-acl.md).
