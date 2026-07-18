# 14. CLI: INFO, SCAN, SLOWLOG, MONITOR

## Введение: «p99 вырос — что в Redis?»

API внезапно стал медленным. Postgres в норме, а Redis на **99% CPU** — оказалось, скрипт деплоя запустил `KEYS app:*` на проде. Оператор открыл **SLOWLOG**, увидел команду, нашёл владельца. Эта глава — **диагностика без GUI**: INFO, безопасный обход ключей, slowlog и осторожный MONITOR.

## Что вы узнаете

- Секции **INFO** для ops и разработки.
- **SCAN** вместо **KEYS**.
- **SLOWLOG** — поиск долгих команд.
- **MONITOR** — только на dev/stage.
- Базовый **LATENCY DOCTOR** (preview).

## INFO — панель приборов

```bash
docker exec mock-redis redis-cli INFO
docker exec mock-redis redis-cli INFO server
docker exec mock-redis redis-cli INFO memory
docker exec mock-redis redis-cli INFO stats
docker exec mock-redis redis-cli INFO clients
docker exec mock-redis redis-cli INFO replication
```

| Секция | Вопросы |
|--------|---------|
| **server** | версия, uptime, tcp_port |
| **memory** | used, max, fragmentation |
| **stats** | ops/sec, hits/misses, evicted_keys |
| **clients** | connected_clients, blocked_clients |
| **replication** | role master/replica (intermediate) |
| **cpu** | used_cpu_sys/user |

Полезные поля **stats**:

```text
instantaneous_ops_per_sec
keyspace_hits
keyspace_misses
evicted_keys
```

Hit rate (приблизительно): `hits / (hits + misses)`.

## SCAN — итерация по ключам

**KEYS pattern** — O(N) **всех** ключей, блокирует инстанс.

**SCAN cursor [MATCH pattern] [COUNT hint]** — итеративно:

```bash
docker exec mock-redis redis-cli SCAN 0 MATCH 'lab:*' COUNT 100
```

Повторяйте с новым cursor, пока cursor не станет `0`.

| | KEYS | SCAN |
|---|------|------|
| Блокировка | да, на весь N | короткие шаги |
| Гарантия «увидеть всё за раз» | да | может вернуть дубликаты при изменении данных |
| Prod | **запрещён** | да |

## SLOWLOG

На стенде: `slowlog-log-slower-than 10000` (10 ms).

```bash
docker exec mock-redis redis-cli SLOWLOG GET 10
docker exec mock-redis redis-cli SLOWLOG LEN
```

Каждая запись: id, timestamp, **duration μs**, команда и аргументы.

Искусственно медленная команда (только лаб):

```bash
docker exec mock-redis redis-cli DEBUG SLEEP 0.02
docker exec mock-redis redis-cli SLOWLOG GET 1
```

`DEBUG SLEEP` — **только** учебный стенд.

Очистка slowlog:

```bash
docker exec mock-redis redis-cli SLOWLOG RESET
```

## MONITOR

Поток **всех** команд в реальном времени:

```bash
docker exec -it mock-redis redis-cli MONITOR
```

| | |
|---|---|
| Плюс | мгновенная отладка «кто пишет» |
| Минус | огромный overhead, **не prod** |

Остановка: Ctrl+C.

## CLIENT LIST и память крупного ключа

```bash
docker exec mock-redis redis-cli CLIENT LIST | head -5
docker exec mock-redis redis-cli MEMORY USAGE lab:some:key
```

`MEMORY USAGE` (Redis 4+) — оценка байт на ключ (лаба 15).

## LATENCY (preview)

```bash
docker exec mock-redis redis-cli LATENCY DOCTOR
```

Текстовые рекомендации по задержкам — полезно на stage.

## На стенде: чек-лист инцидента

1. `INFO memory` — OOM/eviction?
2. `INFO stats` — evicted_keys, connections?
3. `SLOWLOG GET 20`
4. `SCAN` по префиксу сервиса, не `KEYS`
5. Redis Commander [http://localhost:8081](http://localhost:8081) — визуально

## Типичные ошибки

| Ошибка | Последствие | Решение |
|--------|-------------|---------|
| `KEYS *` в cron | freeze | SCAN + метрики в приложении |
| MONITOR на prod | CPU spike | structured logging клиента |
| Игнор blocked_clients | BLPOP/BLMOVE зависли | CLIENT LIST, таймауты |
| SLOWLOG слишком высокий порог | не видите 5ms проблем | снизить на stage |

## В продакшене

- Экспорт **redis_exporter** → Prometheus/Grafana.
- Алерты: memory %, evictions, connected_clients, master down.
- Runbook: «latency» → slowlog → top commands → big keys (лаба 15).

## Резюме

**INFO** — первый экран. **SCAN** — безопасный обход. **SLOWLOG** — история тормозов. **MONITOR** — последняя миля на dev. Тяжёлые ключи — [15. Лаба](15-lab-heavy-keys.md).

## Чек-лист

- Какую команду использовать вместо KEYS?
- Где смотреть evicted_keys?
- Почему MONITOR опасен на prod?
- Что означает cursor 0 в SCAN?

Следующий урок: [15. Лаба: тяжёлые ключи](15-lab-heavy-keys.md).
