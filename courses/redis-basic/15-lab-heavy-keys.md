# 15. Лаба: тяжёлые ключи, SCAN и SLOWLOG

## Цель лабы

Создать **большой hash**, измерить **MEMORY USAGE**, попасть в **SLOWLOG** через `HGETALL`, найти ключ **SCAN** и безопасно удалить. Закрепить [14. CLI](14-cli-observability.md).

## Предварительно

- Стенд healthy.
- Префикс: **`lab:heavy:`**

---

## Задание 1. Создать «тяжёлый» hash

**Зачем:** симуляция плохого дизайна (тысячи полей в одном ключе).

```bash
for i in $(seq 1 2000); do
  docker exec mock-redis redis-cli HSET "lab:heavy:profile" "field:$i" "value-$i" >/dev/null
done
docker exec mock-redis redis-cli HLEN lab:heavy:profile
```

**Что увидите:** `(integer) 2000`.

---

## Задание 2. MEMORY USAGE

```bash
docker exec mock-redis redis-cli MEMORY USAGE lab:heavy:profile
docker exec mock-redis redis-cli INFO memory | grep used_memory_human
```

**Что увидите:** число байт (десятки/сотни KB в зависимости от версии).

---

## Задание 3. HGETALL и SLOWLOG

```bash
docker exec mock-redis redis-cli SLOWLOG RESET
docker exec mock-redis redis-cli HGETALL lab:heavy:profile | wc -l
docker exec mock-redis redis-cli SLOWLOG GET 5
```

**Что увидите:** в slowlog может появиться `HGETALL` (если дольше порога 10ms).

**Урок:** в prod — `HSCAN lab:heavy:profile 0 COUNT 50`.

---

## Задание 4. SCAN по префиксу

```bash
docker exec mock-redis redis-cli SCAN 0 MATCH 'lab:heavy:*' COUNT 50
```

**Что увидите:** cursor и список ключей (возможно `lab:heavy:profile`).

Создайте второй ключ:

```bash
docker exec mock-redis redis-cli SET lab:heavy:flag 1
docker exec mock-redis redis-cli SCAN 0 MATCH 'lab:heavy:*' COUNT 50
```

---

## Задание 5. HSCAN вместо HGETALL

```bash
docker exec mock-redis redis-cli HSCAN lab:heavy:profile 0 COUNT 10
```

**Что увидите:** cursor и порция полей — модель пагинации.

---

## Задание 6. Redis Commander

[http://localhost:8081](http://localhost:8081) — размер ключа, тип hash.

---

## Задание 7. Очистка

```bash
docker exec mock-redis redis-cli DEL lab:heavy:profile lab:heavy:flag
docker exec mock-redis redis-cli SLOWLOG RESET
```

---

## Критерии успеха

- [ ] Hash с 2000 полей создан
- [ ] `MEMORY USAGE` выполнен
- [ ] SLOWLOG просмотрен после тяжёлой команды
- [ ] SCAN нашёл ключи по `lab:heavy:*`
- [ ] HSCAN продемонстрирован
- [ ] Ключи удалены

## Что унести в работу

- Лимит полей/размера на ключ в code review.
- Операции O(N) — только через SCAN/HSCAN с COUNT.
- В инциденте: slowlog → MEMORY USAGE → рефакторинг структуры.

Следующий урок: [16. Redis vs Memcached vs Kafka](16-vs-memcached-kafka.md).
