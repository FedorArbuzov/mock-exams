# 03. Лаба: первые ключи, TTL и типы

## Цель лабы

Поднять стенд Redis, выполнить **SET/GET/DEL**, задать **TTL**, проверить **TYPE** и **EXISTS**. Зафиксировать разницу между подключением с хоста (`localhost:6379`) и CLI внутри **`mock-redis`**.

## Предварительно

- Docker запущен, порт **6379** свободен.
- Из корня репозитория:

```bash
cd deploy/redis
docker compose up -d
docker compose ps
```

Контейнер `mock-redis` в статусе **healthy** (подождите 10–30 с). Подробности: [`deploy/redis/README.md`](../../deploy/redis/README.md).

Опционально smoke test:

```bash
bash scripts/smoke.sh
```

Префикс ключей в лабе: **`lab:basic:`** — чтобы не мешать другим.

---

## Задание 1. Ping и INFO

**Зачем:** убедиться, что CLI достучался до инстанса.

```bash
docker exec mock-redis redis-cli ping
docker exec mock-redis redis-cli INFO server | grep redis_version
```

**Что увидите:** `PONG` и строка `redis_version:7.2...`.

**Если Connection refused:** `docker compose logs redis`, дождаться healthcheck.

---

## Задание 2. SET, GET, DEL

**Зачем:** базовый цикл string.

```bash
docker exec mock-redis redis-cli SET lab:basic:hello "Hello Redis"
docker exec mock-redis redis-cli GET lab:basic:hello
docker exec mock-redis redis-cli EXISTS lab:basic:hello
docker exec mock-redis redis-cli DEL lab:basic:hello
docker exec mock-redis redis-cli EXISTS lab:basic:hello
```

**Что увидите:** `OK`, `Hello Redis`, `(integer) 1`, `(integer) 1`, `(integer) 0`.

---

## Задание 3. TTL и EXPIRE

**Зачем:** кэш и сессии всегда с ограниченным временем жизни.

```bash
docker exec mock-redis redis-cli SET lab:basic:ttl "temp" EX 120
docker exec mock-redis redis-cli TTL lab:basic:ttl
```

Подождите 5 с и снова:

```bash
docker exec mock-redis redis-cli TTL lab:basic:ttl
```

**Что увидите:** TTL уменьшается (около 115 после паузы).

Продлите жизнь:

```bash
docker exec mock-redis redis-cli EXPIRE lab:basic:ttl 300
docker exec mock-redis redis-cli TTL lab:basic:ttl
```

---

## Задание 4. SET NX и счётчик

**Зачем:** идемпотентная «занять слот» и атомарный INCR.

```bash
docker exec mock-redis redis-cli SET lab:basic:lock token1 NX EX 30
docker exec mock-redis redis-cli SET lab:basic:lock token2 NX EX 30
```

**Что увидите:** первый `OK`, второй `(nil)` — ключ уже есть.

```bash
docker exec mock-redis redis-cli INCR lab:basic:views
docker exec mock-redis redis-cli INCR lab:basic:views
docker exec mock-redis redis-cli GET lab:basic:views
```

**Что увидите:** `(integer) 2`.

---

## Задание 5. TYPE и WRONGTYPE

**Зачем:** один ключ — один тип.

```bash
docker exec mock-redis redis-cli SET lab:basic:mixed "str"
docker exec mock-redis redis-cli TYPE lab:basic:mixed
docker exec mock-redis redis-cli LPUSH lab:basic:mixed item
```

**Что увидите:** `string`, затем ошибка `WRONGTYPE`.

Исправление:

```bash
docker exec mock-redis redis-cli DEL lab:basic:mixed
docker exec mock-redis redis-cli LPUSH lab:basic:mixed item
docker exec mock-redis redis-cli TYPE lab:basic:mixed
```

**Что увидите:** `list`.

---

## Задание 6. Redis Commander (опционально)

Откройте [http://localhost:8081](http://localhost:8081) — найдите ключи `lab:basic:*`.

---

## Задание 7. Очистка (опционально)

```bash
docker exec mock-redis redis-cli DEL lab:basic:ttl lab:basic:lock lab:basic:views lab:basic:mixed
```

Не используйте `FLUSHALL` на общем стенде.

---

## Критерии успеха

- [ ] `mock-redis` healthy, `PING` → `PONG`
- [ ] SET/GET/DEL выполнены без ошибок
- [ ] TTL уменьшается, `EXPIRE` обновляет срок
- [ ] `SET NX` второй раз вернул `(nil)`
- [ ] `INCR` дал счётчик 2
- [ ] Понятна ошибка `WRONGTYPE` и её исправление

## Что унести в работу

- В лабах курса CLI: `docker exec mock-redis redis-cli …`
- С хоста (приложения): `localhost:6379`
- Всегда **префикс** и **TTL** для временных данных

Следующий урок: [04. Типы данных](04-data-types.md).
