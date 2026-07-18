# 01. Персистентность: RDB и AOF

## Введение: «Redis перезапустили — половина корзин исчезла»

Пятница, деплой новой версии API. Контейнер Redis получил `docker compose restart` без volume — и **все сессии и корзины** пропали. Команда спорит: «Redis же база». Нет: по умолчанию Redis — **in-memory** store; данные переживают рестарт только если включена **персистентность** (RDB и/или AOF) и том с `/data` примонтирован.

На intermediate вы выбираете режим осознанно: снимок раз в N минут, журнал каждой записи, или гибрид — и понимаете цену по диску и времени recovery.

## Что вы узнаете

- Чем **RDB** отличается от **AOF**.
- Параметры `save`, `appendonly`, `appendfsync`.
- Как читать `INFO persistence`.
- Компромиссы: потеря данных vs latency vs размер файла.

## RDB — снимок памяти

**RDB** — бинарный дамп всей базы в момент времени (`dump.rdb`).

| Параметр | Смысл |
|----------|--------|
| `save 60 1000` | BGSAVE, если за 60 с было ≥1000 изменений |
| `stop-writes-on-bgsave-error yes` | не писать, если снимок не удался |
| `rdbcompression yes` | сжатие (меньше диск, чуть CPU) |

Процесс **BGSAVE**: fork → дочерний процесс пишет на диск → родитель обслуживает запросы. На больших инстансах fork может дать краткий **latency spike** (copy-on-write).

**Плюсы RDB:** компактный файл, быстрый cold start, удобно для бэкапов.

**Минусы:** между снимками возможна **потеря** последних записей (окно = интервал `save` + нагрузка).

## AOF — журнал команд

**AOF** дописывает каждую mutating-команду в `appendonly.aof`.

| `appendfsync` | Поведение | Риск |
|---------------|-----------|------|
| `always` | fsync после каждой записи | минимальная потеря, высокая latency |
| `everysec` | fsync раз в секунду | до ~1 с потери при crash ОС |
| `no` | ОС сама сбрасывает буфер | быстрее, риск больше |

Периодически Redis делает **rewrite** AOF (компактная «снимковая» форма команд) — `auto-aof-rewrite-percentage`, `auto-aof-rewrite-min-size`.

**Плюсы AOF:** меньше окно потери при `everysec`; понятный audit trail.

**Минусы:** файл больше; recovery дольше, чем RDB на огромных базах.

## Гибрид (Redis 7+)

Можно держать **оба**: RDB для быстрого старта + AOF для свежих записей. В учебном стенде single включён AOF:

[`deploy/redis/config/redis-single.conf`](../../deploy/redis/config/redis-single.conf):

```text
appendonly yes
appendfsync everysec
save 60 1000
```

## На стенде (single)

```bash
cd deploy/redis
docker compose up -d
docker exec mock-redis redis-cli INFO persistence
```

Обратите внимание на:

- `aof_enabled`, `aof_last_rewrite_time_sec`
- `rdb_last_save_time`, `rdb_bgsave_in_progress`
- `loading` — идёт ли загрузка с диска при старте

Принудительный снимок:

```bash
docker exec mock-redis redis-cli BGSAVE
docker exec mock-redis redis-cli LASTSAVE
```

## Типичные ошибки

| Симптом | Причина | Решение |
|---------|---------|---------|
| После рестарта пусто | нет volume / `appendonly no` | volume + AOF или RDB |
| Диск 100%, Redis read-only | AOF разросся, нет rewrite | место на диске, `BGREWRITEAOF` |
| Лаги каждые N минут | `save` на огромной БД | реже `save`, только AOF, больше RAM |
| «Бэкап» через `KEYS *` | не снимок, блокирует | `BGSAVE`, копия `dump.rdb` |
| AOF повреждён после crash | partial write | `redis-check-aof`, repair |

## В продакшене

- **Кэш** без персистентности — норма (данные восстанавливаются из primary DB).
- **Очередь / сессии** — AOF `everysec` или managed с Multi-AZ.
- Бэкапы: копия RDB **после** успешного BGSAVE на S3 (лаба 18).
- Тестируйте **restore** на стенде раз в квартал — файл может не открыться.

## Резюме

RDB — периодический снимок, быстрый restart. AOF — журнал команд, меньше потерь между снимками. Учебный single-стенд использует **AOF everysec + save 60 1000** — разумный компромисс для лаб.

## Чек-лист

- Что произойдёт с данными при `kill -9` redis через 30 с после записи при только RDB `save 300 1`?
- Чем `BGSAVE` отличается от `SAVE`?
- Какой `appendfsync` выберете для сессий пользователей?
- Где на диске лежит `dump.rdb`? (`CONFIG GET dir`)

Следующий урок: [02. Лаба: RDB/AOF](02-lab-rdb-aof.md).
