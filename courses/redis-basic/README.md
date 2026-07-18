# Redis — Basic

Базовый уровень: **зачем Redis**, **архитектура и типы данных**, **кэш и сессии**, **Pub/Sub**, **pipeline и транзакции**, **память и eviction**, **CLI и observability**.

**Предварительно:** базовый Linux и Docker ([`linux-basic`](../linux-basic/README.md) или [`linux-intermediate`](../linux-intermediate/README.md) — достаточно `docker compose` и терминала).

**Локально:** [`deploy/redis`](../../deploy/redis/README.md) — `docker compose up -d`, с хоста: **`localhost:6379`**, Redis Commander: [http://localhost:8081](http://localhost:8081).

**Дальше:** [`redis-intermediate`](../redis-intermediate/README.md) (репликация, Sentinel, ACL), [`redis-advanced`](../redis-advanced/README.md).

## Как читать главы

Каждый урок — **глава книги**, не шпаргалка. Рекомендуемый порядок внутри пары:

1. Прочитайте **теорию** (01, 02, 04…) — не пропускайте введение и «типичные ошибки».
2. Откройте **лабу** (03-lab, 05-lab…) с поднятым стендом `docker compose up -d` в `deploy/redis`.
3. Выполняйте задания **по номерам**; сверяйте вывод с блоком «что увидите».
4. Если что-то не сходится — [`deploy/redis/README.md`](../../deploy/redis/README.md) (healthcheck, порты, `maxmemory`).

**Структура теории:** введение (сценарий с работы) → что узнаете → концепции → пример на стенде → ошибки → в проде → резюме → чек-лист.

**Структура лабы:** цель → предварительно → задания 1…N (зачем / команды / что увидите) → критерии успеха.

**Время:** около **40–50 минут** на пару «теория + лаба»; [финальный проект](17-final-project.md) — **2–3 часа**.

**Шпаргалка подключения:**

| Откуда | Адрес |
|--------|--------|
| Хост (`redis-cli`, приложение) | `localhost:6379` |
| Внутри Docker-сети | `redis:6379` |
| Redis Commander | [http://localhost:8081](http://localhost:8081) |

CLI в контейнере: `docker exec -it mock-redis redis-cli` (см. лабы).

## Программа

### Основы (01–03)

1. [Зачем Redis](01-why-redis.md)
2. [Архитектура: память, single-thread, ключи](02-architecture.md)
3. [Лаба: первые ключи и TTL](03-lab-first-keys.md)

### Типы данных и приложения (04–05)

4. [Типы данных: string, hash, list, set, zset](04-data-types.md) · 5. [Лаба: сессия и корзина](05-lab-session-cart.md)

### Кэш (06–07)

6. [Паттерны: cache-aside, TTL, stampede](06-patterns-cache.md) · 7. [Лаба: cache-aside](07-lab-cache-aside.md)

### Pub/Sub (08–09)

8. [Pub/Sub: каналы и ограничения](08-pubsub.md) · 9. [Лаба: уведомления через Pub/Sub](09-lab-pubsub.md)

### Производительность (10–11)

10. [Pipeline и транзакции MULTI/EXEC](10-pipeline-transactions.md) · 11. [Лаба: pipeline](11-lab-pipeline.md)

### Память (12–13)

12. [Память, maxmemory, eviction](12-memory-eviction.md) · 13. [Лаба: eviction на стенде](13-lab-eviction.md)

### Операции (14–15)

14. [CLI: INFO, SCAN, SLOWLOG](14-cli-observability.md) · 15. [Лаба: тяжёлые ключи](15-lab-heavy-keys.md)

### Сравнение и финал (16–17)

16. [Redis vs Memcached vs Kafka](16-vs-memcached-kafka.md)
17. [Финальный проект](17-final-project.md)

## Что должно получиться

- Объясняете, чем **in-memory store** отличается от **БД** и **брокера сообщений**.
- Работаете с **ключами**, **TTL**, **hash/list/set/zset** через `redis-cli`.
- Реализуете **сессию**, **корзину** и **cache-aside** на стенде.
- Используете **Pub/Sub**, **PIPELINE**, понимаете **eviction** при `maxmemory`.
- Диагностируете через **INFO**, **SCAN**, **SLOWLOG**; сравниваете Redis с Memcached и Kafka.

## Примеры

| Путь | Назначение |
|------|------------|
| [`examples/session.json`](examples/session.json) | образец payload сессии для лабы 05 |
| [`examples/rate-limit-keys.txt`](examples/rate-limit-keys.txt) | соглашение по ключам для финального проекта (rate limit) |
