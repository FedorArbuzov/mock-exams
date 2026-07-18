# 16. Лаба: PgBouncer

## Зачем эта лаба

Подключение через **6432** и сравнение с прямым **5432** под `pgbench` закрепляет, зачем pooler нужен при многих клиентах. Лаба **опциональна**, если в compose ещё нет PgBouncer — можно добавить сервис или оформить tabletop с конфигом.

## Предусловия

- Primary Postgres на 5432.
- `pgbench` в клиенте PostgreSQL или в контейнере.

## Задание 1. Добавить PgBouncer в compose (опционально)

Фрагмент для `deploy/postgres/docker-compose.yml`:

```yaml
  pgbouncer:
    image: edoburu/pgbouncer:latest
    container_name: mock-pgbouncer
    ports:
      - "6432:6432"
    environment:
      DATABASE_URL: postgres://course:course@postgres:5432/course
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 200
      DEFAULT_POOL_SIZE: 20
    depends_on:
      postgres:
        condition: service_healthy
```

```bash
docker compose -f deploy/postgres/docker-compose.yml up -d pgbouncer
```

## Задание 2. Проверка подключения

```bash
psql "postgresql://course:course@localhost:6432/course" -c "SELECT current_database(), inet_server_addr();"
```

**Ожидание:** БД `course`, запрос проходит.

Повторите с 5432 — сравните `inet_server_addr()` (адрес Postgres vs PgBouncer).

## Задание 3. SHOW POOLS (admin, если доступен)

```bash
psql "postgresql://course:course@localhost:6432/pgbouncer" -c "SHOW POOLS;"
psql "postgresql://course:course@localhost:6432/pgbouncer" -c "SHOW STATS;"
```

Если admin DB недоступен — зафиксируйте в отчёте «образ без admin»; достаточно заданий 2 и 4.

## Задание 4. pgbench — прямой vs pool

Инициализация (один раз, через pool или direct):

```bash
pgbench -i -s 10 "postgresql://course:course@localhost:5432/course"
```

Тест **напрямую** (50 клиентов, 30 сек):

```bash
pgbench -c 50 -j 2 -T 30 "postgresql://course:course@localhost:5432/course"
```

Запишите **tps** и **latency average**.

Тест **через PgBouncer** (если поднят):

```bash
pgbench -c 50 -j 2 -T 30 "postgresql://course:course@localhost:6432/course"
```

| Метрика | 5432 direct | 6432 pool |
|---------|-------------|-----------|
| tps | | |
| avg latency | | |
| errors | | |

На маленьком стенде разница может быть умеренной; при `pgbench -c 200` direct часто упирается в `max_connections`, pool — нет.

## Задание 5. Краткий отчёт (5–10 предложений)

Ответьте:

1. Сколько backend на primary при 50 pgbench clients без PgBouncer? (`pg_stat_activity` во время теста)
2. Сколько при тех же 50 через PgBouncer? (`SHOW POOLS` или activity)
3. Когда бы вы **не** пускали миграции через transaction pool?

## Путь B — без Docker PgBouncer

Файл `docs/pgbouncer-config.md`:

- `[databases]` и `[pgbouncer]` секции из [15-pgbouncer](15-pgbouncer.md)
- Схема app → 6432 → 5432
- Ограничения transaction mode для вашего ORM

## Если что-то пошло не так

| Симптом | Решение |
|---------|---------|
| Connection refused 6432 | Сервис не стартовал; `docker compose ps` |
| Auth failed | `DATABASE_URL`, userlist образа |
| pgbench FATAL too many clients | Снизить `-c` или использовать pool |
| TPS одинаковый | Мало клиентов; увеличить `-c` |

## Критерии успеха

- [ ] `SELECT 1` через 6432 OK **или** конфиг-doc готов
- [ ] pgbench direct зафиксирован
- [ ] Сравнение с pool (или обоснование tabletop)
- [ ] Понимаете, почему миграции — на 5432

## Дальше

Финальный проект: [17-final-project.md](17-final-project.md).
