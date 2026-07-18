# 10. Лаба: OOM recovery

## Цель лабы

Искусственно заполнить Redis до **`maxmemory`** с `noeviction`, увидеть **OOM при write**, затем восстановить сервис через **смену policy**, **выборочное удаление** и **UNLINK** большого ключа — без `FLUSHALL` (как в prod).

## Предварительно

- [06. Память](06-memory-advanced.md), [09. Troubleshooting](09-troubleshooting.md).
- Single-node:

```bash
cd deploy/redis && docker compose up -d
redis-cli PING
```

---

## Задание 1. Установить жёсткий лимит

```bash
redis-cli CONFIG SET maxmemory 20mb
redis-cli CONFIG SET maxmemory-policy noeviction
redis-cli CONFIG GET maxmemory maxmemory-policy
```

---

## Задание 2. Заполнить память

```bash
redis-cli DEL lab:oom:big
# Создайте большой value (~ несколько MB, подгоните под лимит)
redis-cli DEBUG POPULATE 5000 lab:oom:key 1000
redis-cli INFO memory | grep used_memory_human
```

Добавьте один крупный ключ (пример):

```bash
redis-cli SET lab:oom:big "$(python3 -c 'print("x"*5000000)' 2>/dev/null || printf '%*s' 5000000 | tr ' ' x)"
```

Повторяйте `DEBUG POPULATE` или `SET` пока не приблизитесь к лимиту.

Проверка OOM:

```bash
redis-cli SET lab:oom:trigger should-fail
```

**Что увидите:** `(error) OOM command not allowed when used memory > 'maxmemory'`.

**Чтение** обычно работает:

```bash
redis-cli GET lab:oom:key:1
```

---

## Задание 3. Восстановление без FLUSHALL

**Шаг A — включить eviction для cache-ключей:**

```bash
redis-cli CONFIG SET maxmemory-policy allkeys-lru
redis-cli SET lab:oom:newkey recovered
redis-cli INFO stats | grep evicted_keys
```

**Шаг B — удалить big key асинхронно:**

```bash
redis-cli MEMORY USAGE lab:oom:big
redis-cli UNLINK lab:oom:big
redis-cli INFO memory | grep used_memory_human
```

**Шаг C — снизить давление (опционально):**

```bash
redis-cli --scan --pattern 'lab:oom:key:*' | head -100 | xargs -r redis-cli UNLINK
```

---

## Задание 4. Вернуть безопасные настройки lab

```bash
redis-cli CONFIG SET maxmemory 0
redis-cli CONFIG SET maxmemory-policy noeviction
redis-cli DEL $(redis-cli --scan --pattern 'lab:oom:*' | tr '\n' ' ')
```

Или `docker compose restart` для чистого стенда.

---

## Задание 5. Runbook (письменно)

В 5-7 пунктах опишите runbook «OOM на prod cache»:

1. Подтвердить симптом (`INFO memory`, алерт).
2. Отличить Redis OOM от **kernel OOM**.
3. Найти top keys (`--bigkeys` / memory usage).
4. Mitigation (eviction, unlink, scale).
5. Postmortem (TTL, maxmemory sizing).

---

## Критерии успеха

- [ ] Воспроизведён `OOM command not allowed`.
- [ ] После `allkeys-lru` — запись снова возможна.
- [ ] `UNLINK lab:oom:big` снизил `used_memory`.
- [ ] Runbook записан.

---

## Если не работает

| Симптом | Решение |
|---------|---------|
| OOM не наступает | Уменьшите `maxmemory` до `5mb` |
| `DEBUG POPULATE` отключён | Только `SET` больших строк |
| Windows без python | PowerShell: `'x' * 1000000` в переменную и SET частями |

**Дальше:** [11. Interview Q&A](11-interview-qa.md).
