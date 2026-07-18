# 05. Лаба: cache stampede и TTL jitter

## Цель лабы

Смоделировать **одновременный expiry** и сравнить поведение **без защиты** и с **jitter + простым lock** на single-node стенде (`6379`). Понять метрики, которые смотрели бы в инциденте.

## Предварительно

- [04. Hot keys и stampede](04-hot-keys-stampede.md).
- Single-node (проще, чем Cluster):

```bash
cd deploy/redis
docker compose down 2>/dev/null || true
docker compose up -d
redis-cli PING
```

---

## Задание 1. Baseline: один ключ, короткий TTL

```bash
redis-cli SET lab:stampede:item "payload-from-db" EX 3
redis-cli TTL lab:stampede:item
redis-cli GET lab:stampede:item
```

**Что увидите:** TTL уменьшается; после 3 с — `(nil)`.

---

## Задание 2. «Шторм» без защиты (симуляция)

В **двух** терминалах одновременно после `EXPIRE` (или подождите TTL) выполните:

```bash
# Терминал A и B — в одну секунду после истечения TTL
redis-cli GET lab:stampede:item
redis-cli GET lab:stampede:item
```

Запишите: оба получили miss → в реальном приложении оба пошли бы в DB.

**Расширение (опционально):** скрипт bash:

```bash
for i in $(seq 1 20); do
  redis-cli GET lab:stampede:item &
done
wait
```

После `SET ... EX 1` и `sleep 2` — 20 параллельных miss.

---

## Задание 3. TTL jitter

**Зачем:** разнести моменты expiry.

```bash
for i in $(seq 1 100); do
  jitter=$((RANDOM % 30))
  redis-cli SET "lab:cache:$i" "v$i" EX $((60 + jitter)) >/dev/null
done
redis-cli --scan --pattern 'lab:cache:*' | wc -l
```

Проверьте распределение TTL (выборочно):

```bash
redis-cli TTL lab:cache:1
redis-cli TTL lab:cache:50
```

**Что увидите:** TTL от 60 до 89 — нет единого «пика» в одну секунду.

---

## Задание 4. Lock при miss (ручной сценарий)

```bash
redis-cli DEL lab:stampede:item lab:stampede:lock
redis-cli SET lab:stampede:item "warm" EX 5
```

Симулируйте **первый** клиент с lock:

```bash
redis-cli GET lab:stampede:item
redis-cli SET lab:stampede:lock 1 NX EX 10
# «загрузка из DB»
redis-cli SET lab:stampede:item "reloaded-$(date +%s)" EX 60
redis-cli DEL lab:stampede:lock
```

Второй клиент при занятом lock:

```bash
redis-cli SET lab:stampede:lock 1 NX EX 10
# (nil) — lock не взят
redis-cli GET lab:stampede:item
```

**Что увидите:** один «загрузчик», второй читает уже заполненный ключ (или ждёт retry в приложении).

---

## Задание 5. Интервью-рефлексия

В `examples/cluster-notes.md` или отдельном блоке ответьте письменно:

1. Почему `SETNX` lock лучше, чем `SET lock 1` без `NX`?
2. Что если holder lock **умер** до `DEL`? (TTL на lock.)
3. Почему Redlock избыточен для **одного** инстанса?

---

## Критерии успеха

- [ ] Продемонстрирован miss при истечении TTL.
- [ ] 100 ключей с jitter — TTL разбросаны.
- [ ] Lock: только один `SET NX` успешен.
- [ ] Три ответа на рефлексию сформулированы.

---

## Если не работает

| Симптом | Решение |
|---------|---------|
| `RANDOM` не работает | PowerShell: `$j = Get-Random -Maximum 30` вручную для пары ключей |
| Порт 6379 занят | `docker compose down` в других профилях redis |

**Дальше:** [06. Память](06-memory-advanced.md).
