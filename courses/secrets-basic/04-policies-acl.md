# 04. Политики ACL: path, capabilities, least privilege

## Введение: «у CI полный root»

Pipeline deploy читает production DB password через **root token** в `VAULT_TOKEN` — любой job с доступом к variable получает **все engines** и может удалить PKI CA. Security требует policy **readonly** на `secret/data/course/*` и запрет `delete` на prod paths. Эта глава — синтаксис **ACL policy**, связь token ↔ policy, пример [`policy-readonly.hcl`](../../deploy/vault/examples/policy-readonly.hcl).

## Что вы узнаете

- Структура policy: `path` + `capabilities`.
- Разница capabilities для **KV v2** (`data/` vs `metadata/`).
- **Default deny**, implicit root, тест policy новым token.
- Именование policies для сервисов и CI.

## Policy как firewall

Всё, что не разрешено policy токена — **запрещено**. Root token обходит ACL (ещё одна причина не использовать root в CI).

```hcl
# Минимальный read на один secret
path "secret/data/course/checkout/db" {
  capabilities = ["read"]
}
```

## Capabilities

| Capability | Смысл |
|------------|--------|
| `read` | GET secret data |
| `list` | LIST keys (каталог) |
| `create` | новый key / первая версия |
| `update` | новая версия KV |
| `delete` | удаление версий / metadata ops |
| `sudo` | root-like на path (редко) |
| `deny` | явный запрет (перекрывает allow) |

Для **patch** KV v2 нужны `update` (и обычно `read`).

## KV v2: два path prefix

| Действие | Path в policy |
|----------|---------------|
| Читать значения | `secret/data/course/checkout/*` |
| Листинг ключей | `secret/metadata/course/checkout/*` |
| Удалить версию | `delete` на `secret/data/...` и/или `secret/delete/...` |

Ошибка новичка: policy только на `secret/course/*` → **403** на `kv get`.

## Пример readonly (репозиторий)

[`deploy/vault/examples/policy-readonly.hcl`](../../deploy/vault/examples/policy-readonly.hcl):

```hcl
path "secret/data/course/*" {
  capabilities = ["read", "list"]
}

path "secret/metadata/course/*" {
  capabilities = ["read", "list"]
}
```

- CI **deploy-readonly** читает checkout secrets, не пишет.
- Отдельная policy `course-writer` с `create`, `update` только на `secret/data/course/dev/*`.

## Wildcards

| Pattern | Match |
|---------|--------|
| `secret/data/course/*` | один сегмент после course |
| `secret/data/course/+` | то же (Vault grammar) |
| `secret/data/course/checkout/*` | все ключи под checkout |

Избегайте `secret/data/*` с `delete` для application tokens.

## Привязка policy к token

1. `vault policy write course-readonly policy-readonly.hcl`
2. `vault token create -policy=course-readonly -ttl=30m`
3. Экспорт `VAULT_TOKEN=<new>` и проверка `kv get`.

**Token roles** (advanced): templated TTL, orphan tokens, batch tokens.

## На стенде: просмотр policies

```bash
docker exec -e VAULT_TOKEN=course mock-vault vault policy list
docker exec -e VAULT_TOKEN=course mock-vault vault policy read default
```

После лабы 05 появится `course-readonly`.

## Типичные ошибки

| Ошибка | Симптом | Исправление |
|--------|---------|-------------|
| Path без `data/` | permission denied | `secret/data/...` |
| `read` без `list` | UI/CLI list пустой | добавить `list` на metadata |
| Одна policy на все env | dev job читает prod | prefix `course/dev`, `course/prod` |
| Root в GitLab variable | полный компромисс Vault | role + approle/k8s auth |
| Забыть renew TTL | внезапный 403 mid-deploy | renewable token + script renew |

## В продакшене

- Policy as code в Git → `vault policy write` в pipeline admin.
- **Sentinel** (Enterprise) — guardrails (запрет wildcard delete).
- Разделение: **human** policies vs **machine** policies.
- Регулярный **access review**: кто имеет `sudo`, кто читает prod.
- Тест: `vault token capabilities <token> secret/data/prod/foo`.

## Заметки для собеседования

- Vault ACL **default deny**.
- Policy не наследуются автоматически — объединение **union** capabilities.
- **Batch tokens** — нельзя renew, для одноразовых CI (advanced).
- Root policy = `root`, не смешивать с app.

## Резюме

Policy ограничивает token по **path** и **capabilities**. KV v2 требует отдельных правил для `data/` и `metadata/`. Readonly для CI — типовой первый шаг; лаба [05](05-lab-policies.md) применяет файл из `deploy/vault/examples/`.

## Чек-лист

- Какие capabilities нужны для `kv put`?
- Зачем `list` на metadata path?
- Где лежит пример readonly policy в репо?
- Почему root token опасен в GitLab?

Следующий урок: [05. Лаба: политики](05-lab-policies.md).
