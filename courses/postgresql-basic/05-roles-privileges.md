# 05. Роли, права, безопасность

## Сценарий с работы

Аудит безопасности: в production connection string от FastAPI — пользователь `postgres` с SUPERUSER. Компрометация приложения = полный контроль над кластером. Параллельно аналитик не может подключиться: забыли `GRANT USAGE ON SCHEMA`. DevOps правит `pg_hba.conf`, делает reload — но забывает, что строки читаются **сверху вниз**, и первая подходящая побеждает; в итоге `reject` для всех или, хуже, `trust` для `0.0.0.0/0`.

Postgres не разделяет «пользователь» и «группу» как отдельные сущности — всё это **роли**. Эта глава — минимальная модель прав для приложения, CI и людей.

## Что вы узнаете

- Роли LOGIN / NOLOGIN и типичное разделение migrator / app / readonly
- Уровни GRANT: database → schema → table → column
- `ALTER DEFAULT PRIVILEGES` для будущих таблиц
- Роль `pg_hba.conf` и SCRAM-SHA-256
- Зачем приложению запрещён SUPERUSER (preview RLS)

## Роли = пользователи и группы

```sql
CREATE ROLE app_reader LOGIN PASSWORD 'changeme';
CREATE ROLE app_writer LOGIN PASSWORD 'changeme';
CREATE ROLE app_group NOLOGIN;
GRANT app_group TO app_reader;
```

| Атрибут | Смысл |
|---------|-------|
| `LOGIN` | Можно подключиться (учётная запись) |
| `NOLOGIN` | Групповая роль; права через `GRANT role TO user` |
| `SUPERUSER` | Обходит все проверки — **только break-glass** |
| `CREATEDB` / `CREATEROLE` | Создание БД/ролей — не для runtime приложения |

На стенде `course` — суперпользователь для обучения. В [06-lab-roles](06-lab-roles.md) создадите `shop_reader` и `shop_writer`.

## GRANT по уровням

Права **не наследуются** автоматически вниз по иерархии. Нужна цепочка:

```sql
GRANT CONNECT ON DATABASE course TO app_reader;
GRANT USAGE ON SCHEMA shop TO app_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA shop TO app_reader;

ALTER DEFAULT PRIVILEGES IN SCHEMA shop
  GRANT SELECT ON TABLES TO app_reader;
```

| Право | Уровень | Без него |
|-------|---------|----------|
| `CONNECT` | Database | Нельзя подключиться к БД |
| `USAGE` | Schema | Не видны объекты схемы |
| `SELECT`, `INSERT`, … | Table | Операции над данными |
| `USAGE, SELECT` | Sequence | Нельзя `nextval` для serial |
| `EXECUTE` | Function | Нельзя вызвать функцию |

**Типичный баг:** выдали `SELECT ON ALL TABLES`, создали новую таблицу миграцией — приложение падает с `permission denied`. Решение — `ALTER DEFAULT PRIVILEGES` от имени владельца объектов (часто роль `migrator`).

## Минимальные привилегии (least privilege)

| Роль | Назначение | Права |
|------|------------|-------|
| `shop_migrator` | CI / Flyway / Alembic | DDL в схеме `shop` |
| `shop_app` | Runtime FastAPI/Django | `SELECT, INSERT, UPDATE, DELETE` на нужные таблицы |
| `shop_report` | BI, Metabase | `SELECT` только |
| `dba_human` | Ручные операции | Не SUPERUSER; расширенные права по политике |

Приложение **никогда** не должно:

- иметь `SUPERUSER` (чтение/запись любых файлов через `COPY PROGRAM`, отключение логирования);
- владеть объектами, которые создаёт мигратор от другого имени (путаница с `DEFAULT PRIVILEGES`).

Подробнее compliance и аудит — [postgresql-security](../postgresql-security/README.md).

## SUPERUSER — только break-glass

SUPERUSER обходит RLS, ownership, большинство ограничений. Используйте для аварийного восстановления, не для `DATABASE_URL` в Kubernetes Secret.

## pg_hba.conf — кто может подключиться

Файл в PGDATA. Формат строки:

```text
# TYPE  DATABASE  USER       ADDRESS         METHOD
host    course    course     127.0.0.1/32    scram-sha-256
host    course    shop_app   10.0.0.0/8      scram-sha-256
host    all       all        0.0.0.0/0       reject
```

| Поле | Значение |
|------|----------|
| TYPE | `local` (socket) или `host` (TCP) |
| DATABASE | Имя БД или `all` |
| USER | Роль или `all` |
| ADDRESS | CIDR для `host` |
| METHOD | `scram-sha-256`, `cert`, `reject`, … |

**Порядок важен:** первая совпавшая строка применяется. После правки:

```sql
SELECT pg_reload_conf();
```

Симптом «password authentication failed» при верном пароле — часто неверная строка hba или подключение с другого IP (Docker network vs host).

## SCRAM-SHA-256

Современный метод хранения паролей в `pg_authid`. MD5 — legacy, в новых инсталляциях не используйте. В `password_encryption` ожидайте `scram-sha-256`. Детали — [security/02-scram-auth](../postgresql-security/02-scram-auth.md).

## Row Level Security (preview)

Даже с правильным GRANT все строки таблицы видны роли с `SELECT`. **RLS** фильтрует строки по политике:

```sql
ALTER TABLE shop.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON shop.orders
  USING (tenant_id = current_setting('app.tenant_id')::int);
```

Приложение выставляет `SET app.tenant_id = '42'` на сессию. Полный курс — [security/10-rls-audit](../postgresql-security/10-rls-audit.md).

## Типичные ошибки

1. Одна роль на миграции и runtime — новые таблицы без GRANT для app.
2. `GRANT ALL` «чтобы работало» — аналитик получает DELETE на проде.
3. Правка hba без reload — «я сохранил файл, почему не пускает».
4. Пароль в git в connection string — ротация = боль; секреты в Vault/K8s Secret ([secrets-basic](../secrets-basic/README.md)).

## Чек-лист

- [ ] Отличаю LOGIN и NOLOGIN роль
- [ ] Знаю цепочку CONNECT → USAGE → SELECT
- [ ] Понимаю, зачем `ALTER DEFAULT PRIVILEGES`
- [ ] Могу объяснить строку в `pg_hba.conf`
- [ ] Приложение без SUPERUSER — non-negotiable

## Дальше

Лаба: [06-lab-roles.md](06-lab-roles.md).
