# 11. Lua в Redis

## Введение: «два INCR — и лимит API пробит»

Rate limit: `GET` лимита, в приложении `if count < 10`, затем `INCR`. Между корутинами оба прошли проверку — **11-й** запрос проскочил. Нужна **атомарность**: проверка + изменение в одном round-trip.

**Lua scripting** в Redis выполняет скрипт **атомарно** (никто не вклинится между командами в скрипте).

## Что вы узнаете

- `EVAL` / `EVALSHA` и `SCRIPT LOAD`.
- Ограничения: один event loop, скрипт должен быть быстрым.
- Паттерны: rate limit, compare-and-set, **distributed lock** (осторожно).
- Почему Redlock спорен и что использовать вместо.

## Базовый синтаксис

```bash
EVAL "return redis.call('GET', KEYS[1])" 1 mykey
```

| Аргумент | Смысл |
|----------|--------|
| скрипт | Lua 5.1 |
| numkeys | сколько из ARGV — это KEYS |
| KEYS[1] | первый ключ |
| ARGV[1] | аргумент |

`redis.call()` — ошибка прерывает скрипт; `redis.pcall()` — как команда с ответом ошибки.

## Атомарный INCR с лимитом

```lua
local current = tonumber(redis.call('GET', KEYS[1]) or '0')
if current >= tonumber(ARGV[1]) then
  return 0
end
return redis.call('INCR', KEYS[1])
```

```bash
EVAL "<script>" 1 ratelimit:user:42 10
```

## Distributed lock (учебный паттерн)

Классика (упрощённо, **не** полный Redlock):

```lua
if redis.call('SET', KEYS[1], ARGV[1], 'NX', 'EX', ARGV[2]) then
  return 1
end
return 0
```

- `KEYS[1]` — `lock:resource`
- `ARGV[1]` — уникальный token (UUID воркера)
- `ARGV[2]` — TTL секунд

Снятие lock только если token совпадает (вторая Lua — лаба 12).

**В проде:** для строгой координации чаще **PostgreSQL advisory lock**, **etcd**, или брокер; Redis-lock приемлем для **best-effort** (кэш rebuild), не для денег.

## Ограничения

| Правило | Причина |
|---------|---------|
| Скрипт короткий | блокирует Redis single-thread |
| Не долгие циклы | latency для всех |
| Детерминизм | репликация: одинаковый эффект |
| Ключи в одном slot | для Cluster — все KEYS в одном slot |

## На стенде

```bash
docker exec mock-redis redis-cli EVAL "return 1+1" 0
docker exec mock-redis redis-cli SCRIPT LOAD "return redis.call('PING')"
```

## Типичные ошибки

| Симптом | Причина | Решение |
|---------|---------|---------|
| `NOSCRIPT` | кэш сброшен | `EVAL` или `SCRIPT LOAD` |
| Зависания | бесконечный цикл в Lua | лимит итераций, review |
| Lock не освободился | нет TTL | всегда `EX` |
| Два владельца lock | только SET NX без verify | compare-del в Lua |
| `CROSSSLOT` | ключи в Cluster | hash tag `{id}` |

## В продакшене

- Храните скрипты в репозитории, версионируйте SHA.
- Метрика: `slowlog` на `EVAL`.
- ACL: отдельный user с `+eval` только нужным ключам.

## Резюме

Lua даёт атомарность без MULTI/EXEC для логики с ветвлениями. Lock на `SET NX EX` + verify token — базовый паттерн лабы 12.

## Чек-лист

- Почему два отдельных `redis-cli` не атомарны?
- Зачем token в lock value?
- Почему lock нужен с TTL?
- Когда Lua избыточен?

Следующий урок: [12. Лаба: lock](12-lab-lua-lock.md).
