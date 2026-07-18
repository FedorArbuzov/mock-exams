# 02. Лаба: RDB и AOF на single-стенде

## Цель лабы

На живом инстансе [`deploy/redis`](../../deploy/redis/README.md) (`docker compose up -d`) вы увидите, как **запись попадает на диск**, как читать `INFO persistence`, и что происходит при **рестарте** с volume.

## Предварительно

- Docker запущен.
- Порт `6379` свободен (остановите replication/sentinel compose, если поднимали).

```bash
cd deploy/redis
docker compose down
docker compose up -d
docker compose ps
```

`mock-redis` — **healthy**.

---

## Задание 1. Базовая линия

**Зачем:** зафиксировать состояние до экспериментов.

```bash
docker exec mock-redis redis-cli INFO persistence | egrep 'aof_|rdb_|loading'
docker exec mock-redis redis-cli CONFIG GET save
docker exec mock-redis redis-cli CONFIG GET appendonly
```

**Что увидите:** `aof_enabled:1`, `appendfsync` через `CONFIG GET appendfsync`, `save` с правилом вроде `60 1000`.

---

## Задание 2. Запись и BGSAVE

**Зачем:** создать данные и получить RDB вручную.

```bash
docker exec mock-redis redis-cli SET lab:persist:key1 "value-$(date +%s)"
docker exec mock-redis redis-cli DBSIZE
docker exec mock-redis redis-cli BGSAVE
```

Ждём окончания:

```bash
docker exec mock-redis redis-cli INFO persistence | grep rdb_bgsave_in_progress
```

Когда `rdb_bgsave_in_progress:0`:

```bash
docker exec mock-redis redis-cli LASTSAVE
docker exec mock-redis redis-cli CONFIG GET dir
```

**Что увидите:** UNIX timestamp `LASTSAVE`, каталог `/data` (в volume).

Проверка файла:

```bash
docker exec mock-redis ls -la /data
```

Ожидаются `dump.rdb` и при включённом AOF — `appendonly.aof`.

---

## Задание 3. AOF в действии

**Зачем:** убедиться, что mutating-команды попадают в журнал.

```bash
docker exec mock-redis redis-cli SET lab:persist:key2 incremental
docker exec mock-redis redis-cli INCR lab:persist:counter
ls -la deploy/redis  # на хосте том не виден — смотрим в контейнере:
docker exec mock-redis ls -la /data/appendonly.aof 2>/dev/null || \
  docker exec mock-redis ls -la /data
```

Опционально — статистика rewrite:

```bash
docker exec mock-redis redis-cli INFO persistence | grep aof_
```

---

## Задание 4. Рестарт и проверка данных

**Зачем:** главный критерий персистентности — данные после рестарта.

```bash
docker restart mock-redis
until docker exec mock-redis redis-cli PING | grep -q PONG; do sleep 1; done
docker exec mock-redis redis-cli GET lab:persist:key1
docker exec mock-redis redis-cli GET lab:persist:counter
```

**Что увидите:** значения на месте.

Если ключей нет — проверьте volume в `docker compose.yml` и что не делали `docker compose down -v`.

---

## Задание 5. (Опционально) Окно потери RDB

**Зачем:** почувствовать trade-off **только RDB** (на копии стенда не обязательно).

Только для понимания — **не** оставляйте в проде:

```bash
docker exec mock-redis redis-cli CONFIG SET save ""
docker exec mock-redis redis-cli CONFIG SET appendonly no
# записать ключ, убить контейнер до BGSAVE — ключ может пропасть
```

Верните настройки из `redis-single.conf` рестартом:

```bash
docker compose restart redis
```

---

## Критерии успеха

| # | Критерий |
|---|----------|
| 1 | `INFO persistence` показывает включённый AOF |
| 2 | После `BGSAVE` — `rdb_bgsave_in_progress:0` |
| 3 | В `/data` есть `dump.rdb` |
| 4 | После `docker restart mock-redis` ключи `lab:persist:*` читаются |
| 5 | Вы можете объяснить разницу RDB и AOF своими словами |

## Что унести в работу

- Для **кэша** персистентность часто выключена; для **очереди/сессий** — AOF или managed backup.
- Операторский чек: `INFO persistence`, место на диске, успешность последнего BGSAVE.

Следующий урок: [03. Репликация](03-replication.md).
