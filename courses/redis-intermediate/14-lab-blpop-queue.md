# 14. Лаба: надёжная очередь на List и BLPOP

## Цель лабы

Собрать очередь `queue:pending` / `queue:processing` с `LMOVE`, обработать задачу с **ACK** и симулировать возврат «потерянной» задачи.

## Предварительно

Single-стенд: `docker compose up -d`.

---

## Задание 1. Очистка и постановка задач

```bash
docker exec mock-redis redis-cli DEL queue:pending queue:processing queue:done
docker exec mock-redis redis-cli LPUSH queue:pending '{"id":"job-1","action":"email"}'
docker exec mock-redis redis-cli LPUSH queue:pending '{"id":"job-2","action":"resize"}'
docker exec mock-redis redis-cli LLEN queue:pending
```

---

## Задание 2. Воркер забирает задачу (LMOVE)

```bash
docker exec mock-redis redis-cli LMOVE queue:pending queue:processing RIGHT LEFT
docker exec mock-redis redis-cli LRANGE queue:processing 0 -1
docker exec mock-redis redis-cli LLEN queue:pending
```

**Что увидите:** одна задача в `processing`, одна осталась в `pending`.

---

## Задание 3. Успешный ACK

После «обработки» удалите из processing и отметьте done:

```bash
TASK='{"id":"job-1","action":"email"}'
docker exec mock-redis redis-cli LREM queue:processing 1 "$TASK"
docker exec mock-redis redis-cli SADD queue:done job-1
docker exec mock-redis redis-cli SISMEMBER queue:done job-1
```

---

## Задание 4. Симуляция падения воркера

Заберите вторую задачу, **не** делайте ACK:

```bash
docker exec mock-redis redis-cli LMOVE queue:pending queue:processing RIGHT LEFT
docker exec mock-redis redis-cli LRANGE queue:processing 0 -1
```

Reaper (ручной возврат):

```bash
docker exec mock-redis redis-cli RPOPLPUSH queue:processing queue:pending
# или: LRANGE + LPUSH + LREM — в проде скрипт/Lua
docker exec mock-redis redis-cli LLEN queue:pending
```

**Что увидите:** задача снова в `pending`.

---

## Задание 5. BLPOP для ожидания

Терминал 1:

```bash
docker exec mock-redis redis-cli BLPOP queue:pending 0
```

Терминал 2 (или после Ctrl+C — короткий таймаут):

```bash
docker exec mock-redis redis-cli LPUSH queue:pending '{"id":"job-3"}'
```

**Что увидите:** BLPOP разблокируется и вернёт элемент.

---

## Задание 6. Идемпотентность

Повторно «обработайте» `job-1`:

```bash
docker exec mock-redis redis-cli SADD queue:done job-1
```

`SADD` вернёт `0` — дубликат не создан. В приложении проверяйте `SISMEMBER` или ключ в БД.

---

## Критерии успеха

| # | Критерий |
|---|----------|
| 1 | `LMOVE` атомарно переносит задачу |
| 2 | ACK удаляет из `processing` |
| 3 | Без ACK reaper возвращает в `pending` |
| 4 | `BLPOP` блокируется до `LPUSH` |
| 5 | `SADD queue:done` предотвращает повтор |

Следующий урок: [15. Мониторинг](15-monitoring.md).
