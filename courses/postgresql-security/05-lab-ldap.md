# 05. Лаба: LDAP

## Зачем эта лаба

На проде LDAP часто недоступен в учебном стенде. **Tabletop** закрепляет поток auth, pg_hba, отзыв доступа и сравнение с RDS IAM — без поднятия AD.

## Предусловия

- [04-ldap-ad](04-ldap-ad.md)
- Понимание pg_hba ([03-lab-scram](03-lab-scram.md))

## Задание 1. Диаграмма потока

Нарисуйте (текст или mermaid):

```text
developer laptop
  → psql (TLS?)
    → PostgreSQL (pg_hba: ldap)
      → corporate LDAP/AD (port 636, LDAPS)
        → bind OK → PG checks role + GRANT
```

Ответьте:

| Вопрос | Ваш ответ |
|--------|-----------|
| Где проверяется пароль? | LDAP bind |
| Где проверяются права на таблицы? | PostgreSQL GRANT |
| Что если роли нет в PG? | Login fail после LDAP OK |

## Задание 2. Пример pg_hba

Скопируйте и адаптируйте под `corp.local`:

```text
host all jdoe 10.0.0.0/8 ldap \
  ldapserver=ldap.corp.local \
  ldapport=636 \
  ldaptls=1 \
  ldapbasedn="dc=corp,dc=local"
```

Документируйте:

- Почему `ldaptls=1` обязателен
- Почему CIDR `10.0.0.0/8`, а не `0.0.0.0/0`

## Задание 3. Недоступность LDAP

| Сценарий | Поведение | Действие on-call |
|----------|-----------|------------------|
| LDAP down 5 мин | Новые logins fail | Status page, wait |
| LDAP down 2 ч | Dev blocked | Break-glass SCRAM role |
| Существующая сессия | Живёт до disconnect | `pg_terminate_backend` при offboard |

Опишите **break-glass** роль: кто имеет доступ, MFA, audit.

## Задание 4. LDAP groups → PG roles

PostgreSQL **не** маппит AD groups автоматически. Типичный процесс:

```sql
-- HR offboarding ticket → automation
REVOKE shop_app FROM jdoe;
-- или
DROP ROLE jdoe;
```

Tabletop: группа `CN=ShopDevelopers` → роль `shop_app`:

| Шаг | Кто | Действие |
|-----|-----|----------|
| Onboard | IAM script | `CREATE ROLE jdoe LOGIN; GRANT shop_app TO jdoe` |
| Offboard | IAM script | `REVOKE ...; DROP ROLE` + AD disable |

Опционально: [optional-ldap.md](optional-ldap.md).

## Задание 5. Сравнение методов auth

| Метод | Когда | Плюсы | Минусы |
|-------|-------|-------|--------|
| SCRAM | VM Postgres, small team | Просто, нет LDAP SLA | Пароли per-DB |
| LDAP/AD | On-prem, corp SSO | Централизация | LDAP dependency |
| IAM token | AWS RDS | Short-lived, no static pwd | AWS-only, SDK in app |

Для shop API на RDS — какой метод и почему?

## Troubleshooting (tabletop)

| Симптом | Причина | Fix |
|---------|---------|-----|
| `LDAP authentication failed` | Wrong password / AD lock | Reset AD |
| `role "jdoe" does not exist` | LDAP OK, PG role missing | CREATE ROLE + GRANT |
| `could not contact LDAP server` | Network / cert | Check 636, firewall |
| Login OK, permission denied | GRANT missing | `GRANT` на schema/table |

## Критерии успеха

- [ ] Диаграмма потока developer → LDAP → PG
- [ ] pg_hba пример с LDAPS
- [ ] План отзыва: AD disable + REVOKE/DROP
- [ ] Таблица SCRAM vs LDAP vs IAM
- [ ] Break-glass описан

## Дальше

pgaudit: [06-pgaudit.md](06-pgaudit.md).
