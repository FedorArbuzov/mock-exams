# 09. ACL: пользователи и команды

## Введение: «стажёр сделал FLUSHALL на проде»

До Redis 6 «пароль на всё» (`requirepass`) не различал read и admin. **ACL** (Access Control List) задаёт **пользователей**: пароль, разрешённые **команды**, **ключи** и **pub/sub** каналы.

На intermediate вы отделяете приложение (read/write `app:*`) от мониторинга (только `+@read`) и от админа.

## Что вы узнаете

- Синтаксис `ACL SETUSER`, `ACL LIST`.
- Категории `+@read`, `+@write`, `-@dangerous`.
- Шаблоны ключей `~app:*`.
- Файл `aclfile` vs runtime ACL.

## Модель ACL

```text
user readonly on >secret ~app:* -@all +@read +ping +info
```

| Часть | Смысл |
|-------|--------|
| `user readonly` | имя |
| `on` / `off` | активен |
| `>secret` | пароль (SHA256 в файле) |
| `~app:*` | доступ только к ключам `app:...` |
| `&*` | pub/sub channels (опционально) |
| `+@read` | категория команд |
| `-@all` + явные `+` | deny-by-default |

Опасные команды: `+@dangerous` включает `FLUSHALL`, `CONFIG`, `DEBUG` — не давайте приложению.

## Учебный стенд

[`redis-single.conf`](../../deploy/redis/config/redis-single.conf):

```text
aclfile /usr/local/etc/redis/users.acl
```

Стартовый [`users.acl`](../../deploy/redis/config/users.acl):

```text
user default on nopass ~* &* +@all
```

Для лабы read-only — [`examples/acl-readonly.acl`](examples/acl-readonly.acl).

## Команды

```bash
ACL LIST
ACL WHOAMI
ACL SETUSER appwriter on >app-secret ~app:* -@all +@write +@read +ping
AUTH appwriter app-secret
SET app:session:1 ok
SET other:key 1   # NOPERM
```

Сохранение в файл:

```bash
ACL SAVE
```

Загрузка из примера курса:

```bash
ACL LOAD
# или монтирование aclfile в compose
```

## На стенде

```bash
cd deploy/redis
docker compose up -d
docker exec mock-redis redis-cli ACL LIST
docker exec mock-redis redis-cli ACL GETUSER default
```

## Типичные ошибки

| Симптом | Причина | Решение |
|---------|---------|---------|
| `NOPERM` | ключ вне `~pattern` | расширить шаблон или команду |
| Все заблокированы | `default off` без пароля | аварийный `aclfile` |
| ACL не пережил рестарт | не `ACL SAVE` | `aclfile` в volume |
| Приложение не может `EVAL` | нет `+eval` | отдельный user для Lua |
| `AUTH` не тот user | default отключён | явный `AUTH user pass` |

## В продакшене

- **default** отключить или сильный пароль; отдельные users per service.
- Ротация паролей через Secrets Manager / Vault.
- ElastiCache: RBAC + пользователи (см. [19](19-managed-elasticache.md)).
- Аудит: `ACL LOG` (Redis 7+).

## Резюме

ACL — least privilege для Redis: ключи + команды + пользователи. Учебный single уже монтирует `users.acl`; лаба 10 добавит **readonly**.

## Чек-лист

- Чем ACL лучше одного `requirepass`?
- Что означает `~app:*`?
- Как запретить `FLUSHALL` приложению?
- Где хранится ACL после `ACL SAVE`?

Следующий урок: [10. Лаба: read-only](10-lab-acl-readonly.md).
