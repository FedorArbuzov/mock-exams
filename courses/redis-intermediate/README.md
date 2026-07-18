# Redis — Intermediate

Средний уровень: **персистентность (RDB/AOF)**, **репликация и ручной failover**, **Sentinel**, **Streams**, **ACL**, **Lua**, **надёжные очереди**, **мониторинг**, **бэкапы**, **ElastiCache**.

**Предварительно:** [`redis-basic`](../redis-basic/README.md) (типы данных, TTL, базовый `redis-cli`) и Docker ([`linux-basic`](../linux-basic/README.md) или [`linux-intermediate`](../linux-intermediate/README.md)).

**Локально:** [`deploy/redis`](../../deploy/redis/README.md).

| Стенд | Compose | Порты с хоста |
|-------|---------|----------------|
| Один инстанс (Streams, ACL, Lua, slowlog, backup) | `docker compose up -d` | `6379`, UI `8081` |
| Master + replica | `docker compose -f docker-compose.replication.yml up -d` | master `6379`, replica `6380` |
| Sentinel HA | `docker compose -f docker-compose.sentinel.yml up -d` | master `6379`, Sentinel `26379` |

Перед сменой стенда остановите предыдущий compose — иначе конфликт `6379` / `8081` (см. README стенда).

**Дальше:** [`redis-advanced`](../redis-advanced/README.md) (Cluster, Redis Stack).

**Смежно:** [`kafka-basic`](../kafka-basic/README.md) — сравнение Streams с consumer group; [`aws-basic`](../aws-basic/07-databases.md) — ElastiCache.

## Как читать главы

Каждый урок — **глава книги**, не шпаргалка. Рекомендуемый порядок внутри пары:

1. Прочитайте **теорию** (01, 03, 05…) — не пропускайте введение и «типичные ошибки».
2. Откройте **лабу** (02-lab, 04-lab…) с нужным compose в `deploy/redis`.
3. Выполняйте задания **по номерам**; сверяйте вывод с блоком «что увидите».
4. Если что-то не сходится — [`deploy/redis/README.md`](../../deploy/redis/README.md).

**Структура теории:** введение (сценарий с работы) → что узнаете → концепции → пример на стенде → ошибки → в проде → резюме → чек-лист.

**Структура лабы:** цель → предварительно → задания 1…N (зачем / команды / что увидите) → критерии успеха.

**Время:** около **45–60 минут** на пару «теория + лаба»; [финальный проект](20-final-project.md) — **2–3 часа**.

**Шпаргалка подключения:**

| Стенд | Запись | Чтение | Sentinel |
|-------|--------|--------|----------|
| Single | `localhost:6379` | то же | — |
| Replication | `6379` (master) | `6380` (replica) | — |
| Sentinel | узнать через `SENTINEL get-master-addr-by-name` | replica по политике клиента | `localhost:26379` |

CLI: `redis-cli -h localhost -p 6379` или `docker exec -it mock-redis redis-cli`.

## Программа

### Персистентность (01–02)

1. [RDB и AOF](01-persistence.md) · 2. [Лаба: RDB/AOF](02-lab-rdb-aof.md)

### Репликация (03–04)

3. [Репликация master–replica](03-replication.md) · 4. [Лаба: replica и ручной failover](04-lab-replica-failover.md)

### Sentinel (05–06)

5. [Redis Sentinel](05-sentinel.md) · 6. [Лаба: автоматический failover](06-lab-sentinel.md)

### Streams (07–08)

7. [Streams: лог событий в Redis](07-streams.md) · 8. [Лаба: consumer group](08-lab-streams-consumer.md)

### Безопасность (09–10)

9. [ACL: пользователи и команды](09-acl.md) · 10. [Лаба: read-only пользователь](10-lab-acl-readonly.md)

### Скрипты (11–12)

11. [Lua в Redis](11-lua.md) · 12. [Лаба: распределённая блокировка](12-lab-lua-lock.md)

### Надёжность (13–14)

13. [Очереди, BLPOP, at-least-once](13-reliability.md) · 14. [Лаба: очередь на BLPOP](14-lab-blpop-queue.md)

### Операции (15–18)

15. [Мониторинг и метрики](15-monitoring.md) · 16. [Лаба: SLOWLOG](16-lab-slowlog.md)
17. [Операции: память, eviction, FLUSH](17-operations.md) · 18. [Лаба: backup и restore](18-lab-backup.md)

### Облако и финал (19–20)

19. [Managed: ElastiCache](19-managed-elasticache.md)
20. [Финальный проект](20-final-project.md)

## Что должно получиться

- Выбираете **RDB vs AOF** под сценарий и читаете `INFO persistence`.
- Настраиваете **master/replica**, проверяете lag и делаете **ручной** promote.
- Наблюдаете **Sentinel failover** и находите текущий master.
- Строите **Stream + consumer group**, сравниваете с Kafka consumer group.
- Ограничиваете доступ через **ACL** (read-only пользователь).
- Пишете **Lua** для атомарной блокировки.
- Собираете **очередь задач** на Lists + BLPOP с идемпотентностью.
- Читаете **SLOWLOG**, **INFO**, делаете **бэкап** RDB/AOF.
- Объясняете, когда брать **ElastiCache** вместо self-hosted Redis.

## Примеры

| Путь | Назначение |
|------|------------|
| [`examples/acl-readonly.acl`](examples/acl-readonly.acl) | ACL для лабы 10 |
| [`examples/backup-restore.sh`](examples/backup-restore.sh) | скрипт бэкапа для лабы 18 |
