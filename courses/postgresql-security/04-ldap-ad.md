# 04. LDAP / Active Directory

## Сценарий с работы

Компания централизует identity в **Active Directory**. DevOps не хочет 200 паролей в Postgres. **LDAP bind** в `pg_hba` — пользователь логинится корпоративным паролем; в Postgres всё равно нужна роль `LOGIN` с GRANT.

В AWS вместо LDAP — **IAM database authentication** для RDS. Выбор метода — org policy.

## Что вы узнаете

- Схему LDAP auth в Postgres
- Строку pg_hba для LDAP
- RDS IAM / Azure patterns
- vs SCRAM local — tradeoffs

## Схема

```text
psql client
    → PostgreSQL (pg_hba: ldap)
        → LDAP/AD bind (ldapserver:636 TLS)
            → success → PG checks role exists + GRANT
```

PostgreSQL **не** создаёт роли автоматически из LDAP (без доп. tooling). Типично:

```sql
CREATE ROLE jdoe LOGIN;  -- без PASSWORD при ldap auth
GRANT shop_app TO jdoe;
```

## pg_hba ldap

```text
host all ldapuser 10.0.0.0/8 ldap ldapserver=ldap.corp.local ldapport=636 ldaptls=1 ldapbasedn="dc=corp,dc=local"
```

| Параметр | Смысл |
|----------|-------|
| `ldapserver` | Host AD/LDAP |
| `ldapport` | 636 LDAPS |
| `ldaptls` | TLS к LDAP |
| `ldapbasedn` | Search base |

Документация PG: LDAP authentication. Тестируйте на staging AD.

## Отзыв доступа

1. Disable user в AD — мгновенно для новых binds.
2. `REVOKE` / `DROP ROLE` в PG — убрать GRANT.
3. `pg_terminate_backend` активных сессий.

Быстрее чем ротация SCRAM пароля на 50 ролей.

## Недоступность LDAP

| Состояние | Поведение |
|-----------|-----------|
| LDAP down | **Новые** logins fail; существующие сессии живут |
| Break-glass | Локальная SCRAM роль `dba_breakglass` только с bastion |

Планируйте break-glass **вне** LDAP.

## RDS / cloud

| Платформа | Метод |
|-----------|-------|
| AWS RDS | IAM DB auth token ([aws-intermediate](../aws-intermediate/README.md)) |
| Azure | Entra ID / managed identity patterns |
| Self-hosted | LDAP или SCRAM + Vault |

IAM token — короткоживущий; приложение запрашивает через AWS SDK.

## vs SCRAM local

| | LDAP/AD | SCRAM local |
|---|---------|-------------|
| Централизация | Да | Per-database |
| Зависимость | LDAP SLA | Только PG |
| Offboarding | AD disable | ALTER ROLE / DROP |
| Complexity | hba + AD certs | Проще |
| Cloud native | Часто IAM лучше | SCRAM + secrets |

## Типичные ошибки

1. LDAP без TLS — пароли в clear к AD.
2. Роль в PG забыли — LDAP OK, `role does not exist`.
3. Все humans SUPERUSER в PG «потому что AD admin».
4. Нет break-glass — LDAP outage = total lockout.

## Чек-лист

- [ ] Роль в PG нужна при LDAP auth
- [ ] Отзыв: AD + PG
- [ ] TLS к LDAP (636)
- [ ] Break-glass local role
- [ ] RDS IAM как альтернатива

## Дальше

Лаба-tabletop: [05-lab-ldap.md](05-lab-ldap.md). Опционально: [optional-ldap.md](optional-ldap.md).
