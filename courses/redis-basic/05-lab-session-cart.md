# 05. Лаба: сессия (HASH) и корзина (SET)

## Цель лабы

Смоделировать **сессию пользователя** в HASH по образцу [`session.json`](examples/session.json) и **корзину** как SET SKU с TTL. Проверить частичное обновление полей и идемпотентность `SADD`.

## Предварительно

- Стенд поднят (`deploy/redis`, `mock-redis` healthy).
- Прочитаны [04. Типы данных](04-data-types.md).
- Префикс: **`lab:cart:`**

---

## Задание 1. Создать сессию

**Зачем:** hash хранит поля без перезаписи всего объекта.

Возьмите `sessionId` и поля из примера (или свои):

```bash
docker exec mock-redis redis-cli HSET lab:cart:session:sess-demo \
  userId "user-881" \
  email "learner@example.com" \
  locale "ru-RU" \
  roles "student"

docker exec mock-redis redis-cli EXPIRE lab:cart:session:sess-demo 1800
docker exec mock-redis redis-cli TTL lab:cart:session:sess-demo
```

**Что увидите:** `(integer) 4` полей, TTL около 1800.

```bash
docker exec mock-redis redis-cli HGET lab:cart:session:sess-demo locale
docker exec mock-redis redis-cli HMGET lab:cart:session:sess-demo userId email
```

---

## Задание 2. Обновить lastSeen без полной перезаписи

**Зачем:** типичный запрос «пользователь сделал действие».

```bash
docker exec mock-redis redis-cli HSET lab:cart:session:sess-demo lastSeenAt "2026-05-18T15:00:00Z"
docker exec mock-redis redis-cli HGETALL lab:cart:session:sess-demo
```

**Что увидите:** все поля, включая новое `lastSeenAt`.

Продлите TTL сессии при активности:

```bash
docker exec mock-redis redis-cli EXPIRE lab:cart:session:sess-demo 1800
```

---

## Задание 3. Корзина как SET

**Зачем:** уникальные SKU; повторный `SADD` не дублирует.

```bash
docker exec mock-redis redis-cli SADD lab:cart:basket:user-881 BOOK-KAFKA-101 BOOK-REDIS-101
docker exec mock-redis redis-cli SADD lab:cart:basket:user-881 BOOK-KAFKA-101
docker exec mock-redis redis-cli SCARD lab:cart:basket:user-881
docker exec mock-redis redis-cli SMEMBERS lab:cart:basket:user-881
```

**Что увидите:** `SCARD` = 2.

```bash
docker exec mock-redis redis-cli EXPIRE lab:cart:basket:user-881 86400
```

---

## Задание 4. Удалить товар и проверить

```bash
docker exec mock-redis redis-cli SREM lab:cart:basket:user-881 BOOK-REDIS-101
docker exec mock-redis redis-cli SISMEMBER lab:cart:basket:user-881 BOOK-REDIS-101
docker exec mock-redis redis-cli SMEMBERS lab:cart:basket:user-881
```

**Что увидите:** `(integer) 0` для `SISMEMBER`, остался один SKU.

---

## Задание 5. Связь сессии и пользователя (опционально)

**Зачем:** по `sessionId` найти `userId` — обратный индекс.

```bash
docker exec mock-redis redis-cli SET lab:cart:session-index:sess-demo user-881 EX 1800
docker exec mock-redis redis-cli GET lab:cart:session-index:sess-demo
```

В приложении индекс обновляют вместе с созданием сессии.

---

## Задание 6. Проверка в Redis Commander

[http://localhost:8081](http://localhost:8081) — ключи `lab:cart:*`, типы hash/set/string.

---

## Задание 7. Очистка

```bash
docker exec mock-redis redis-cli DEL lab:cart:session:sess-demo lab:cart:basket:user-881 lab:cart:session-index:sess-demo
```

---

## Критерии успеха

- [ ] HASH сессии с ≥4 полями и TTL 1800 с
- [ ] `HSET` одного поля не затирает остальные
- [ ] SET корзины: 2 уникальных SKU после двойного `SADD` одного SKU
- [ ] `SREM` удаляет товар
- [ ] (опц.) индекс session → userId

## Что унести в работу

- Сессия → **HASH** + **EXPIRE** на каждый запрос (sliding session).
- Корзина → **SET** или HASH с qty (если нужно количество — hash field `qty:SKU`).
- Образец JSON — в репозитории; в Redis — поля hash.

Следующий урок: [06. Паттерны кэширования](06-patterns-cache.md).
