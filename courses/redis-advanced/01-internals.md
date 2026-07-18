# 01. Внутренности Redis

## Введение: «Redis тормозит, хотя CPU 20%»

Команда добавила кэш — latency API упала с 200 ms до 5 ms. Через месяц снова 150 ms, Grafana показывает **p99 на Redis**, а `top` на ноде Redis — **одно ядро 95%**, остальные простаивают. Это не баг «мало RAM» — это **модель выполнения**: Redis (классический OSS) обрабатывает команды **в одном потоке** на инстанс. Понимание event loop, очередей и стоимости команд — обязательный блок для advanced и собеседований.

## Что вы узнаете

- **Single-threaded** модель и исключения (I/O threads, modules).
- **Структуры данных** под капотом (SDS, ziplist/listpack, dict).
- **Pipelining** vs транзакции vs Lua.
- **Persistence** на уровне «что блокирует» (кратко; детали — intermediate).
- Типичные **anti-patterns** и вопросы интервьюера.

---

## Event loop и потоки

Redis принимает соединения (часто через **epoll/kqueue**), читает запросы из сокетов и выполняет команды **последовательно** в главном потоке.

```mermaid
flowchart LR
  Clients[Clients]
  AE[ae epoll]
  Q[Command queue]
  Exec[Execute commands]
  Clients --> AE --> Q --> Exec
```

| Аспект | Следствие |
|--------|-----------|
| CPU-bound команда (`KEYS *`, большой `SORT`) | Блокирует **всех** клиентов на инстансе |
| Много мелких команд | Overhead парсинга; помогает **pipeline** |
| Несколько инстансов | Масштаб **горизонтально** (sharding, Cluster) |

**Redis 6+:** опциональные **I/O threads** разгружают чтение/запись сокетов; **логика команд** по-прежнему в main thread (если не module с собственными потоками).

**На собеседовании:** «Почему Redis не использует все ядра?» — осознанный trade-off: проще семантика, меньше lock contention; масштаб через шардирование.

---

## Структуры данных (упрощённо)

| Тип | Пользователь видит | Внутри (эволюция) |
|-----|-------------------|-------------------|
| String | `SET k v` | SDS (binary-safe строка) |
| List | `LPUSH` | listpack / linked list (зависит от версии/размера) |
| Hash | `HSET` | hash table + listpack для малых полей |
| Set | `SADD` | hash table (ключ = member) |
| ZSet | `ZADD` | skip list + hash table |
| Stream | `XADD` | radix tree of listpacks |

**Big-O** в документации — для **одной** команды; константа и размер value matter: `HGETALL` на hash с 100k полей — катастрофа.

---

## Pipelining, MULTI, Lua

| Механизм | Назначение | Атомарность |
|----------|------------|-------------|
| **Pipeline** | Меньше RTT; пачка команд без ожидания ответа между ними | Нет между командами |
| **MULTI/EXEC** | Очередь команд, выполнение блоком | Да, но без логики «прочитай и реши» между WATCH и EXEC без race |
| **Lua / Function** | Скрипт на сервере | Атомарно как одна команда |

Пример pipeline (стенд single-node `6379`):

```bash
redis-cli --pipe <<'EOF'
SET bench:1 1
SET bench:2 2
SET bench:3 3
EOF
```

**Ошибка новичка:** 10k последовательных `GET` из приложения без pipeline — упираетесь в **сеть**, не в Redis CPU.

---

## Память и аллокатор

Redis использует **jemalloc** (типично). Ключи, значения, метаданные — всё в **RSS**. `INFO memory` — первый экран при OOM ([06](06-memory-advanced.md), [10-lab-oom-recovery](10-lab-oom-recovery.md)).

---

## Persistence (обзор)

| Режим | Плюс | Минус |
|-------|------|-------|
| RDB | Компактный снимок, быстрый restart | Потеря данных между снимками |
| AOF | Более свежие данные | Размер файла, rewrite I/O |
| RDB+AOF | Компромисс в prod | Сложнее ops |

`fork()` для RDB/AOF rewrite → кратковременный **copy-on-write** spike — «Redis съел вдвое RAM».

---

## Anti-patterns

| Плохо | Почему | Лучше |
|-------|--------|-------|
| `KEYS pattern` | O(N) всех ключей, блокировка | `SCAN` |
| Огромные values (> MB) | Сеть, latency, replication lag | Chunk, внешнее хранилище + id в Redis |
| Кэш без TTL | Утечка памяти | TTL + maxmemory policy |
| Один ключ на всё счётчик | Hot key | Sharded counter, local agg |
| Транзакции как locking | Нет отмены блокировки при crash | Redlock / DB lock ([15](15-patterns-redlock.md)) |

---

## На стенде

```bash
cd deploy/redis && docker compose up -d
redis-cli INFO server | head -20
redis-cli --latency-history -i 1
redis-cli SLOWLOG LEN
redis-cli CONFIG GET io-threads
```

---

## Типичные ошибки

- Смотреть только **average** latency, игнорируя **slowlog** и p99.
- Сравнивать Redis с **PostgreSQL** как «универсальную БД» — разные контракты durability.
- Включать **AOF always** без понимания throughput.

---

## Резюме для интервью

1. **Один main thread** на команду → избегайте блокирующих O(N) операций.
2. **Pipeline** — про RTT; **Lua** — про атомарную логику.
3. **Структуры** меняются между версиями — важны сложность и размер value.
4. Масштаб — **не «больше ядер на один инстанс»**, а **шардирование / Cluster**.

**Дальше:** [02. Cluster](02-cluster.md) — как Redis масштабирует запись.
