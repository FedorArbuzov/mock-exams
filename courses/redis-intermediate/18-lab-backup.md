# 18. Лаба: backup и restore RDB

## Цель лабы

Сделать **консистентный** бэкап `dump.rdb` с running instance и восстановить данные через скрипт [`examples/backup-restore.sh`](examples/backup-restore.sh) или вручную.

## Предварительно

```bash
cd deploy/redis
docker compose up -d
chmod +x ../../courses/redis-intermediate/examples/backup-restore.sh
```

---

## Задание 1. Данные для бэкапа

```bash
docker exec mock-redis redis-cli SET lab:backup:user:1 "alice"
docker exec mock-redis redis-cli SET lab:backup:user:2 "bob"
docker exec mock-redis redis-cli DBSIZE
```

---

## Задание 2. BGSAVE и копирование RDB

```bash
docker exec mock-redis redis-cli BGSAVE
until docker exec mock-redis redis-cli INFO persistence | grep -q 'rdb_bgsave_in_progress:0'; do sleep 1; done
docker exec mock-redis redis-cli LASTSAVE

mkdir -p /tmp/redis-backup-lab
docker cp mock-redis:/data/dump.rdb /tmp/redis-backup-lab/dump-lab.rdb
ls -la /tmp/redis-backup-lab/
```

**Что увидите:** файл `dump-lab.rdb` ненулевого размера.

---

## Задание 3. Скрипт backup (из репозитория)

Из корня репозитория:

```bash
./courses/redis-intermediate/examples/backup-restore.sh backup ./tmp-redis-backup
ls -la ./tmp-redis-backup/
```

---

## Задание 4. Симуляция потери данных

```bash
docker exec mock-redis redis-cli FLUSHDB
docker exec mock-redis redis-cli GET lab:backup:user:1
```

**Что увидите:** `(nil)`.

---

## Задание 5. Restore

```bash
./courses/redis-intermediate/examples/backup-restore.sh restore ./tmp-redis-backup/dump-*.rdb
# или конкретный файл:
# ./courses/redis-intermediate/examples/backup-restore.sh restore /tmp/redis-backup-lab/dump-lab.rdb
```

Ручной вариант:

```bash
docker cp /tmp/redis-backup-lab/dump-lab.rdb mock-redis:/data/dump.rdb
docker restart mock-redis
until docker exec mock-redis redis-cli PING | grep -q PONG; do sleep 1; done
docker exec mock-redis redis-cli GET lab:backup:user:1
```

**Что увидите:** `alice`.

---

## Задание 6. AOF (наблюдение)

```bash
docker exec mock-redis redis-cli INFO persistence | grep aof
docker exec mock-redis ls -la /data/
```

Понимание: при включённом AOF recovery может использовать и AOF, и RDB — см. [01-persistence](01-persistence.md).

---

## Критерии успеха

| # | Критерий |
|---|----------|
| 1 | BGSAVE завершился без ошибки |
| 2 | `dump.rdb` скопирован на хост |
| 3 | После FLUSHDB данные отсутствуют |
| 4 | После restore ключи восстановлены |
| 5 | Знаете, когда нужен бэкап off-host (S3) |

## В продакшене

- Автоматические снимки ElastiCache / cron BGSAVE + upload S3.
- Тест restore **ежеквартально**.
- Шифрование бэкапов at rest.

Следующий урок: [19. ElastiCache](19-managed-elasticache.md).
