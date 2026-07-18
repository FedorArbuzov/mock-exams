# 16. Лаба: SLOWLOG и диагностика latency

## Цель лабы

Настроить порог slowlog, **намеренно** выполнить медленную операцию, прочитать SLOWLOG и `LATENCY DOCTOR`.

## Предварительно

`docker compose up -d` в `deploy/redis`.

---

## Задание 1. Текущие настройки

```bash
docker exec mock-redis redis-cli CONFIG GET slowlog-log-slower-than
docker exec mock-redis redis-cli CONFIG GET slowlog-max-len
docker exec mock-redis redis-cli SLOWLOG LEN
```

---

## Задание 2. Снизить порог (временно)

```bash
docker exec mock-redis redis-cli CONFIG SET slowlog-log-slower-than 1
```

1 микросекунда — почти всё попадёт в лог (только для лабы).

---

## Задание 3. Медленная операция

```bash
docker exec mock-redis redis-cli DEBUG SLEEP 0.05
```

Если `DEBUG` запрещён ACL — альтернатива:

```bash
docker exec mock-redis redis-cli EVAL "local i=0; while i<500000 do i=i+1 end return i" 0
```

---

## Задание 4. Чтение SLOWLOG

```bash
docker exec mock-redis redis-cli SLOWLOG GET 5
docker exec mock-redis redis-cli SLOWLOG LEN
```

**Что увидите:** записи с duration (микросекунды), command argv.

---

## Задание 5. COMMANDSTATS

```bash
docker exec mock-redis redis-cli INFO commandstats | head -15
```

Найдите команды с высоким `usec_per_call`.

---

## Задание 6. LATENCY DOCTOR

```bash
docker exec mock-redis redis-cli LATENCY DOCTOR
```

Прочитайте рекомендации (на пустой БД могут быть общие советы).

---

## Задание 7. Вернуть порог

```bash
docker exec mock-redis redis-cli CONFIG SET slowlog-log-slower-than 10000
docker exec mock-redis redis-cli SLOWLOG RESET
```

---

## Критерии успеха

| # | Критерий |
|---|----------|
| 1 | После нагрузки `SLOWLOG GET` не пуст |
| 2 | Понимаете поля duration и command |
| 3 | `INFO commandstats` прочитан |
| 4 | Порог возвращён к 10000 |

Следующий урок: [17. Операции](17-operations.md).
