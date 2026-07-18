# 17. Операции: память, eviction, FLUSH

## Введение: «Redis съел всю RAM на ноде — упал Kubernetes»

Без `maxmemory` Redis может вырасти до **OOM killer** и убить не только себя, но и соседние pod. Оператор выбирает **лимит** и **политику вытеснения** (eviction), знает разницу `FLUSHDB` / `FLUSHALL` и планирует **обслуживание** без сюрпризов.

## Что вы узнаете

- `maxmemory` и политики `maxmemory-policy`.
- `allkeys-lru` vs `volatile-lru` vs `noeviction`.
- Безопасная работа с `FLUSH`, `DEBUG`.
- Плановый restart, версии, `redis-cli --bigkeys`.

## maxmemory

В single-стенде:

```text
maxmemory 256mb
maxmemory-policy allkeys-lru
```

На master replication-стенда — `noeviction` (не терять ключи неожиданно на primary).

| Policy | Поведение |
|--------|-----------|
| `noeviction` | ошибка записи при полной памяти |
| `allkeys-lru` | удаляет любые ключи LRU |
| `volatile-lru` | только с TTL |
| `allkeys-lfu` | LFU (частота) |
| `volatile-ttl` | с наименьшим TTL |

**Кэш:** `allkeys-lru` / `allkeys-lfu`.  
**Очередь/сессии без TTL:** осторожно с LRU — лучше `noeviction` + алерт + scale.

## Проверка памяти

```bash
INFO memory
CONFIG GET maxmemory
CONFIG GET maxmemory-policy
MEMORY STATS
```

## FLUSH — зона катастрофы

| Команда | Эффект |
|---------|--------|
| `FLUSHDB` | очистить текущую DB |
| `FLUSHALL` | все DB |

В prod — **запрет** через ACL (`-flushall`). На стенде:

```bash
# только если понимаете последствия
SELECT 1
FLUSHDB
```

## Обслуживание

| Задача | Подход |
|--------|--------|
| Upgrade minor | replica promote / rolling |
| Патч OS | failover Sentinel |
| Расширение RAM | увеличить limit, restart |
| Поиск больших ключей | `redis-cli --bigkeys`, `MEMORY USAGE` |

## SCAN вместо KEYS

```bash
SCAN 0 MATCH 'app:*' COUNT 100
```

Итеративно, не блокирует event loop как `KEYS *`.

## На стенде

```bash
docker exec mock-redis redis-cli CONFIG GET maxmemory
docker exec mock-redis redis-cli CONFIG GET maxmemory-policy
```

Симуляция давления (осторожно, малый лимит):

```bash
docker exec mock-redis redis-cli CONFIG SET maxmemory 1mb
docker exec mock-redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

Верните после лабы:

```bash
docker compose restart redis
```

## Типичные ошибки

| Симптом | Причина | Решение |
|---------|---------|---------|
| `OOM command not allowed` | maxmemory + noeviction | RAM или policy |
| Кэш «вытесняет» важное | allkeys на mixed workload | отдельные инстансы |
| После FLUSHALL инцидент | ACL | `-@dangerous` |
| Рост без ключей | replication backlog, AOF | `INFO`, disk |
| Hot key | один ключ 80% трафика | шардирование |

## В продакшене

- Отдельные кластеры: **cache** vs **persistent data**.
- Runbook: кто может FLUSH, как восстановить из бэкапа ([18](18-lab-backup.md)).
- В K8s: requests/limits memory с запасом под RSS.

## Резюме

Операции Redis — лимит памяти, осознанная eviction, запрет опасных команд, SCAN для инвентаризации. Бэкап — отдельная глава.

## Чек-лист

- Когда `noeviction` правильнее `allkeys-lru`?
- Чем опасен `FLUSHALL`?
- Как найти самый большой ключ?
- Зачем отдельный Redis под кэш и под очередь?

Следующий урок: [18. Лаба: backup](18-lab-backup.md).
