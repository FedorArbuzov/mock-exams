# 15. Мониторинг Redis

## Введение: «пользователи жалуются на тормоза — а Grafana пустая»

Redis отвечает за миллисекунды, пока не перестаёт. Без метрик вы видите только «timeout». На intermediate вы читаете **`INFO`**, **`SLOWLOG`**, latency doctor и знаете, какие алерты ставить до OOM.

## Что вы узнаете

- Секции `INFO`: memory, stats, replication, commandstats.
- `SLOWLOG`, `LATENCY DOCTOR`, `MEMORY DOCTOR`.
- Ключевые метрики для алертов.
- Интеграция с Prometheus (обзор).

## INFO — главный снимок

```bash
INFO
INFO memory
INFO stats
INFO replication
INFO commandstats
```

| Поле | Смысл |
|------|--------|
| `used_memory_human` | RAM данных |
| `used_memory_rss` | RSS процесса |
| `mem_fragmentation_ratio` | >1.5 — возможна фрагментация |
| `instantaneous_ops_per_sec` | нагрузка |
| `keyspace_hits` / `keyspace_misses` | hit rate кэша |
| `blocked_clients` | ждут BLPOP и т.д. |
| `connected_clients` | число клиентов |

Hit rate (приблизительно):

```text
hits / (hits + misses)
```

## SLOWLOG

В [`redis-single.conf`](../../deploy/redis/config/redis-single.conf):

```text
slowlog-log-slower-than 10000
slowlog-max-len 128
```

10 000 микросекунд = **10 ms** — команды дольше попадают в лог.

```bash
SLOWLOG GET 10
SLOWLOG LEN
CONFIG GET slowlog-log-slower-than
```

## Latency

```bash
LATENCY DOCTOR
LATENCY GRAPH command
```

Показывает типичные проблемы: fork, AOF, eviction, disk.

## MONITOR (осторожно)

```bash
MONITOR
```

Выводит **каждую** команду — только на dev, нагружает prod.

## Клиенты и память ключей

```bash
CLIENT LIST
MEMORY USAGE app:big:key
```

Для больших ключей — пересмотр структуры (Hash vs JSON string).

## На стенде

```bash
cd deploy/redis
docker compose up -d
docker exec mock-redis redis-cli INFO memory | head -20
docker exec mock-redis redis-cli CONFIG GET slowlog-log-slower-than
```

## Экспорт метрик (обзор)

- **redis_exporter** → Prometheus → Grafana.
- ElastiCache: CloudWatch `CPUUtilization`, `DatabaseMemoryUsagePercentage`, `ReplicationLag`.

## Типичные ошибки

| Симптом | Причина | Решение |
|---------|---------|---------|
| OOM | нет maxmemory / policy | `maxmemory`, eviction |
| Высокий RSS | фрагментация | restart, `activedefrag` |
| Рост latency | big keys, `KEYS *` | `SCAN`, разбить ключ |
| `blocked_clients` растёт | медленные BLPOP | больше воркеров |
| SLOWLOG пуст | порог слишком высокий | снизить threshold |

## В продакшене

- Алерты: memory > 80%, replication lag, `rejected_connections`, master down.
- Дашборд: ops/sec, hit rate, slowlog rate, connected clients.
- Не включайте `MONITOR` на проде.

## Резюме

`INFO` + `SLOWLOG` + latency tools — базовый операторский набор. Лаба 16 генерирует медленную команду и читает SLOWLOG.

## Чек-лист

- Как посчитать hit rate?
- Что означает `mem_fragmentation_ratio` > 1.5?
- Зачем `blocked_clients`?
- Почему `KEYS *` опасен?

Следующий урок: [16. Лаба: SLOWLOG](16-lab-slowlog.md).
