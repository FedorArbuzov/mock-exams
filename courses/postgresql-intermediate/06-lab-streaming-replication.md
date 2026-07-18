# 06. Лаба: physical replica (Docker)

## Зачем эта лаба

Streaming replication на бумаге — `pg_hba` + `pg_basebackup`. В Docker сеть и restart усложняют картину. Вы либо поднимаете **второй инстанс на 5433**, либо документируете шаги и доказываете `pg_stat_replication` на primary — оба пути зачтены, если понятна механика.

**Документация стенда:** [`deploy/postgres`](../../deploy/postgres/README.md) — второй инстанс на порту **5433**.

## Предусловия

- Primary `mock-postgres` на **5432**, схема `shop`.
- `wal_level = replica` (лаба [02](02-lab-configuration.md)).
- Достаточно места на диске для копии PGDATA.

## Путь A — полный стенд (рекомендуется)

### Шаг 1. Роль replicator на primary

```sql
CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD 'repl_pass';
```

### Шаг 2. Параметры primary

```sql
ALTER SYSTEM SET wal_level = 'replica';
ALTER SYSTEM SET max_wal_senders = 5;
ALTER SYSTEM SET max_replication_slots = 5;
```

Restart primary:

```bash
docker compose -f deploy/postgres/docker-compose.yml restart postgres
```

### Шаг 3. pg_hba для replication

В контейнере primary добавьте в `pg_hba.conf` (или через init):

```text
host  replication  replicator  0.0.0.0/0  scram-sha-256
```

```sql
SELECT pg_reload_conf();
```

На production — **не** `0.0.0.0/0`; только подсеть replica.

### Шаг 4. pg_basebackup

С хоста (нужен клиент PostgreSQL 16):

```bash
mkdir -p ./replica_data
pg_basebackup -h localhost -p 5432 -U replicator \
  -D ./replica_data -Fp -Xs -P -R -W
```

Пароль: `repl_pass`. Флаг `-R` создаёт `standby.signal` и `primary_conninfo`.

### Шаг 5. Запуск replica на 5433

Пример второго контейнера (упрощённо):

```bash
docker run -d --name mock-postgres-replica \
  -p 5433:5432 \
  -v "$(pwd)/replica_data:/var/lib/postgresql/data" \
  -e POSTGRES_HOST_AUTH_METHOD=scram-sha-256 \
  postgres:16
```

Или отдельный сервис в `docker-compose.yml` — см. расширения репозитория.

### Шаг 6. Проверка primary

```sql
SELECT application_name, client_addr, state, sync_state,
       pg_wal_lsn_diff(sent_lsn, replay_lsn) AS byte_lag
FROM pg_stat_replication;
```

**Ожидание:** одна строка, `state = streaming`, `byte_lag` маленький.

### Шаг 7. Проверка replica

```bash
psql "postgresql://course:course@localhost:5433/course" -c "SELECT pg_is_in_recovery();"
psql "postgresql://course:course@localhost:5433/course" -c "SELECT count(*) FROM shop.products;"
```

**Ожидание:** `pg_is_in_recovery = t`, count совпадает с primary.

### Шаг 8. Read-only на replica

```bash
psql "postgresql://course:course@localhost:5433/course" \
  -c "INSERT INTO shop.products (sku,name,price) VALUES ('x','y',1);"
```

**Ожидание:** `ERROR: cannot execute INSERT in a read-only transaction`.

### Шаг 9. Репликация записи

На primary:

```sql
INSERT INTO shop.products (sku, name, price) VALUES ('repl-test', 'Replica', 9.99);
```

На replica (через 1–2 сек):

```sql
SELECT * FROM shop.products WHERE sku = 'repl-test';
```

## Путь B — tabletop (если нет второго контейнера)

Оформите `docs/streaming-replica-runbook.md`:

1. Чеклист параметров primary.
2. Команда `pg_basebackup` с флагами.
3. SQL проверки `pg_stat_replication`.
4. Ожидаемый вывод `pg_is_in_recovery`.
5. Сценарий failover: `pg_promote()` + что меняется в приложении.

Минимум на primary после настройки replicator:

```sql
-- симуляция: слот без replica пока не подключится
SELECT * FROM pg_replication_slots;
```

## Если что-то пошло не так

| Симптом | Решение |
|---------|---------|
| `password authentication failed for user replicator` | hba, пароль, `pg_hba` reload |
| `wal_level insufficient` | restart после `replica` |
| Replica не стартует | Права на `replica_data`, версия PG, логи `docker logs` |
| Lag растёт | Нагрузка, сеть; `pg_stat_replication` |
| count не совпадает | Replica ещё catchup; подождать |

## Критерии успеха

- [ ] `pg_stat_replication` показывает standby (путь A) **или** runbook ≥ 10 шагов (путь B)
- [ ] `pg_is_in_recovery() = true` на replica
- [ ] SELECT на replica работает, INSERT — нет
- [ ] Новая строка с primary видна на replica

## Дальше

Logical replication: [07-logical-replication.md](07-logical-replication.md).
