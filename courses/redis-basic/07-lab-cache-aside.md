# 07. Лаба: cache-aside вручную

## Цель лабы

Смоделировать **cache-aside** для «товара»: miss → запись из «БД» (фиктивный JSON) → hit. Добавить **TTL с jitter** и **инвалидацию** через `DEL`. Опционально — **lock** от stampede.

## Предварительно

- [06. Паттерны кэширования](06-patterns-cache.md).
- Префикс: **`lab:cache:`**

«База данных» в лабе — строка, которую вы задаёте вручную.

---

## Задание 1. Miss

```bash
docker exec mock-redis redis-cli GET lab:cache:product:101
```

**Что увидите:** `(nil)`.

---

## Задание 2. Загрузка из «БД» и SET

**Зачем:** только при miss пишем в Redis.

```bash
docker exec mock-redis redis-cli SET lab:cache:product:101 \
  '{"sku":"101","name":"Redis Handbook","priceCents":2900}' \
  EX 300
```

Проверка hit:

```bash
docker exec mock-redis redis-cli GET lab:cache:product:101
docker exec mock-redis redis-cli TTL lab:cache:product:101
```

**Что увидите:** JSON и TTL ≤ 300.

---

## Задание 3. Версия ключа

**Зачем:** смена схемы без конфликта.

```bash
docker exec mock-redis redis-cli SET lab:cache:product:v2:101 \
  '{"sku":"101","name":"Redis Handbook","priceCents":2500,"v":2}' \
  EX 320
docker exec mock-redis redis-cli GET lab:cache:product:101
docker exec mock-redis redis-cli GET lab:cache:product:v2:101
```

**Что увидите:** старая и новая версии сосуществуют до TTL.

---

## Задание 4. Инвалидация при «обновлении в админке»

```bash
docker exec mock-redis redis-cli DEL lab:cache:product:101 lab:cache:product:v2:101
docker exec mock-redis redis-cli EXISTS lab:cache:product:v2:101
```

**Что увидите:** `(integer) 0`.

Пересоздайте кэш с новой ценой `1990`:

```bash
docker exec mock-redis redis-cli SET lab:cache:product:v2:101 \
  '{"sku":"101","priceCents":1990,"v":2}' EX 300
```

---

## Задание 5. Lock при miss (опционально)

**Зачем:** один «победитель» строит кэш.

```bash
docker exec mock-redis redis-cli DEL lab:cache:product:202 lab:cache:lock:product:202
docker exec mock-redis redis-cli SET lab:cache:lock:product:202 1 NX EX 10
docker exec mock-redis redis-cli SET lab:cache:lock:product:202 1 NX EX 10
```

**Что увидите:** первый `OK`, второй `(nil)`.

Победитель кладёт данные и снимает lock:

```bash
docker exec mock-redis redis-cli SET lab:cache:product:202 '{"sku":"202"}' EX 300
docker exec mock-redis redis-cli DEL lab:cache:lock:product:202
```

---

## Задание 6. Статистика hit/miss

```bash
docker exec mock-redis redis-cli INFO stats | grep keyspace
```

**Что увидите:** `keyspace_hits` и `keyspace_misses` (растут при работе стенда).

---

## Задание 7. Очистка

```bash
docker exec mock-redis redis-cli DEL lab:cache:product:101 lab:cache:product:v2:101 lab:cache:product:202 lab:cache:lock:product:202
```

---

## Критерии успеха

- [ ] Продемонстрирован miss и последующий hit
- [ ] TTL установлен на кэш-ключ
- [ ] `DEL` как инвалидация перед обновлением
- [ ] (опц.) `SET NX` lock — только один OK
- [ ] Просмотрены `keyspace_hits` / `keyspace_misses`

## Что унести в работу

- Ключ с **версией** (`v2`) упрощает rollout.
- **Инвалидация** = `DEL`, не только ожидание TTL.
- Lock — простейшая защита от stampede на hot key.

Следующий урок: [08. Pub/Sub](08-pubsub.md).
