# 11. Лаба: pipeline и MULTI/EXEC

## Цель лабы

Загрузить пакет ключей через **`--pipe`**, выполнить **MULTI/EXEC** для связанных счётчиков, опционально продемонстрировать **WATCH** с конфликтом.

## Предварительно

- [10. Pipeline и транзакции](10-pipeline-transactions.md).
- Префикс: **`lab:pipe:`**, **`lab:tx:`**

---

## Задание 1. Подготовка счётчиков

```bash
docker exec mock-redis redis-cli MSET lab:tx:a 100 lab:tx:b 50
docker exec mock-redis redis-cli MGET lab:tx:a lab:tx:b
```

**Что увидите:** `100`, `50`.

---

## Задание 2. Pipeline через --pipe

**Зачем:** один round-trip на пачку команд.

Создайте файл (или heredoc в bash):

```bash
printf '%s\n' \
  'SET lab:pipe:k1 v1' \
  'SET lab:pipe:k2 v2' \
  'SET lab:pipe:k3 v3' \
  'INCR lab:pipe:counter' \
  | docker exec -i mock-redis redis-cli --pipe
```

**Что увидите:** строки `All data transferred` / счётчик ответов (зависит от версии cli).

Проверка:

```bash
docker exec mock-redis redis-cli MGET lab:pipe:k1 lab:pipe:k2 lab:pipe:k3
docker exec mock-redis redis-cli GET lab:pipe:counter
```

---

## Задание 3. MULTI/EXEC в интерактивном CLI

**Зачем:** атомарно уменьшить `a` и увеличить `b` (перевод 10 единиц).

```bash
docker exec -it mock-redis redis-cli
```

Внутри:

```text
MULTI
DECRBY lab:tx:a 10
INCRBY lab:tx:b 10
EXEC
MGET lab:tx:a lab:tx:b
```

**Что увидите:** `90`, `60`.

---

## Задание 4. WATCH и конфликт (опционально)

Терминал A:

```bash
docker exec -it mock-redis redis-cli
```

```text
SET lab:tx:version 1
WATCH lab:tx:version
MULTI
SET lab:tx:data "draft"
EXEC
```

Пока A в MULTI (после WATCH, до EXEC), в B:

```bash
docker exec mock-redis redis-cli INCR lab:tx:version
```

В A выполните `EXEC`.

**Что увидите:** `(nil)` или пустой результат EXEC — транзакция отменена из-за изменения watched key.

Сброс:

```bash
docker exec mock-redis redis-cli DEL lab:tx:version lab:tx:data
```

---

## Задание 5. Сравнение: без MULTI

```bash
docker exec mock-redis redis-cli DECRBY lab:tx:a 5
docker exec mock-redis redis-cli INCRBY lab:tx:b 5
```

Между командами другой клиент теоретически мог бы вклиниться — на basic достаточно понимания риска.

---

## Задание 6. Очистка

```bash
docker exec mock-redis redis-cli DEL lab:pipe:k1 lab:pipe:k2 lab:pipe:k3 lab:pipe:counter lab:tx:a lab:tx:b
```

---

## Критерии успеха

- [ ] `--pipe` создал ≥3 ключей и INCR
- [ ] MULTI/EXEC изменил `a` и `b` согласованно
- [ ] (опц.) WATCH + чужой INCR отменил EXEC
- [ ] Понятна разница pipeline vs MULTI

## Что унести в работу

- Массовая загрузка лаб — `--pipe`; в приложении — pipeline API клиента.
- Финансовые микрооперации — MULTI или Lua, не цикл GET/SET с хоста.

Следующий урок: [12. Память и eviction](12-memory-eviction.md).
