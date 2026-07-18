# 12. Лаба: распределённая блокировка на Lua

## Цель лабы

Реализовать **захват** и **освобождение** lock через Lua на single-стенде; убедиться, что второй клиент не снимает чужой lock.

## Предварительно

`docker compose up -d` в `deploy/redis`.

---

## Задание 1. Скрипт захвата

Сохраните в переменную или файл `acquire.lua`:

```lua
if redis.call('SET', KEYS[1], ARGV[1], 'NX', 'EX', tonumber(ARGV[2])) then
  return 1
end
return 0
```

```bash
ACQUIRE='if redis.call("SET", KEYS[1], ARGV[1], "NX", "EX", tonumber(ARGV[2])) then return 1 end return 0'
docker exec mock-redis redis-cli DEL lab:lock:resource
docker exec mock-redis redis-cli EVAL "$ACQUIRE" 1 lab:lock:resource worker-a 30
```

**Что увидите:** `(integer) 1`.

Повтор от worker-b:

```bash
docker exec mock-redis redis-cli EVAL "$ACQUIRE" 1 lab:lock:resource worker-b 30
```

**Что увидите:** `(integer) 0`.

---

## Задание 2. Скрипт освобождения (compare-and-del)

```lua
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0
```

```bash
RELEASE='if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("DEL", KEYS[1]) end return 0'
docker exec mock-redis redis-cli EVAL "$RELEASE" 1 lab:lock:resource worker-b
docker exec mock-redis redis-cli EVAL "$RELEASE" 1 lab:lock:resource worker-a
docker exec mock-redis redis-cli EXISTS lab:lock:resource
```

**Что увидите:** первый release — `0`, второй — `1`, ключ удалён.

---

## Задание 3. TTL и «мёртвый» воркер

```bash
docker exec mock-redis redis-cli EVAL "$ACQUIRE" 1 lab:lock:resource worker-crash 5
docker exec mock-redis redis-cli TTL lab:lock:resource
sleep 6
docker exec mock-redis redis-cli EVAL "$ACQUIRE" 1 lab:lock:resource worker-b 30
```

**Что увидите:** после истечения TTL worker-b снова захватывает lock.

---

## Задание 4. SCRIPT LOAD

```bash
SHA=$(docker exec mock-redis redis-cli SCRIPT LOAD "$ACQUIRE" | tr -d '\r')
docker exec mock-redis redis-cli DEL lab:lock:resource
docker exec mock-redis redis-cli EVALSHA "$SHA" 1 lab:lock:resource w1 10
```

---

## Критерии успеха

| # | Критерий |
|---|----------|
| 1 | Только один acquire возвращает 1 |
| 2 | Чужой release не удаляет ключ |
| 3 | После TTL lock можно захватить снова |
| 4 | `EVALSHA` работает после `SCRIPT LOAD` |

## Что унести в работу

- Всегда **TTL** на lock.
- Снимать lock только с **проверкой token**.
- Для финансовых транзакций — координатор сильнее Redis lock.

Следующий урок: [13. Надёжность](13-reliability.md).
