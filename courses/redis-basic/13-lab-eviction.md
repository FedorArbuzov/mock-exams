# 13. Лаба: maxmemory и eviction

## Цель лабы

Наблюдать рост **used_memory**, срабатывание **eviction** при политике `allkeys-lru` на стенде. Сравнить ключ **с TTL** и **без TTL**. Не использовать `FLUSHALL`.

## Предварительно

- [12. Память и eviction](12-memory-eviction.md).
- Стенд с `maxmemory 256mb` ([`redis-single.conf`](../../deploy/redis/config/redis-single.conf)).
- Префикс: **`lab:evict:`**

**Внимание:** лаба создаёт много данных; выполняйте на локальном стенде, очистите ключи в конце.

---

## Задание 1. Базовые метрики

```bash
docker exec mock-redis redis-cli CONFIG GET maxmemory
docker exec mock-redis redis-cli CONFIG GET maxmemory-policy
docker exec mock-redis redis-cli INFO memory | grep -E 'used_memory_human|maxmemory|mem_fragmentation'
docker exec mock-redis redis-cli INFO stats | grep evicted_keys
```

**Что увидите:** policy `allkeys-lru`, лимит ~256mb.

---

## Задание 2. Заполнение без TTL (осторожно)

**Зачем:** при `allkeys-lru` вытесняются и такие ключи.

Скрипт в bash (уменьшите `COUNT`, если лаба идёт медленно):

```bash
for i in $(seq 1 500); do
  docker exec mock-redis redis-cli SET "lab:evict:bulk:$i" "$(printf '%01024d' 0)" >/dev/null
done
```

Проверка памяти:

```bash
docker exec mock-redis redis-cli INFO memory | grep used_memory_human
docker exec mock-redis redis-cli DBSIZE
```

**Что увидите:** рост `used_memory`; при приближении к лимиту — рост `evicted_keys`.

```bash
docker exec mock-redis redis-cli INFO stats | grep evicted_keys
```

---

## Задание 3. Ключ с TTL vs без TTL

```bash
docker exec mock-redis redis-cli SET lab:evict:hot "important" EX 3600
docker exec mock-redis redis-cli SET lab:evict:cold "less-important"
```

Продолжите добавлять мусорные ключи (ещё 200 итераций цикла или `--pipe` файл с SET).

Проверьте, существуют ли ещё `hot` и `cold`:

```bash
docker exec mock-redis redis-cli EXISTS lab:evict:hot lab:evict:cold
```

**Что увидите:** один или оба могли быть выгнаны — LRU приближённый, порядок не гарантирован строго.

---

## Задание 4. OOM на noeviction (опционально, только локально)

**Не делайте на общем стенде командыды.**

Временно (до перезапуска контейнера):

```bash
docker exec mock-redis redis-cli CONFIG SET maxmemory-policy noeviction
```

При почти полной памяти попробуйте:

```bash
docker exec mock-redis redis-cli SET lab:evict:oom-test "$(printf '%05000000d' 0)"
```

**Что увидите:** возможно `(error) OOM command not allowed`.

Верните policy:

```bash
docker exec mock-redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

---

## Задание 5. Очистка

Удалите только свои ключи:

```bash
docker exec mock-redis redis-cli --scan --pattern 'lab:evict:*' | head -20
```

Пакетное удаление (bash):

```bash
docker exec mock-redis redis-cli --scan --pattern 'lab:evict:*' \
  | xargs -r docker exec -i mock-redis redis-cli DEL
```

На Windows без `xargs` — удалите диапазон вручную или перезапустите volume:

```bash
cd deploy/redis
docker compose down -v
docker compose up -d
```

---

## Критерии успеха

- [ ] Прочитаны `maxmemory` и `maxmemory-policy`
- [ ] `used_memory` вырос при массовом SET
- [ ] `evicted_keys` > 0 после заполнения (или объяснено, почему 0 при малом объёме)
- [ ] Лабовые ключи удалены, `FLUSHALL` не использовался

## Что унести в работу

- Кэш-инстанс: **TTL на всё** + `volatile-lru` или отдельный Redis.
- Алерт на рост **evicted_keys** и падение hit rate в БД.

Следующий урок: [14. CLI и observability](14-cli-observability.md).
