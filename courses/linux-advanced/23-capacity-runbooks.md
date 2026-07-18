# 23. Capacity planning и runbooks

## Введение: алерт «CPU 90%» — scale или починить?

Рефлекс «добавить реплики» без анализа часто **умножает** проблему (I/O bound DB, leak памяти). **Capacity planning** — смотреть тренды **до** 80% утилизации. **Runbook** — что делать в 03:00, когда дежурный не помнит все команды.

## Что вы узнаете

- Метрики по ресурсам: CPU, RAM, disk, network.
- Horizontal vs vertical scale.
- Структура **runbook**.
- On-call severity и post-incident.

---

## Capacity — что смотреть

| Ресурс | Метрики | Действие |
|--------|---------|----------|
| CPU | load, %util, throttling | optimize, scale out, limits |
| RAM | used, swap, OOM | fix leak, add RAM, limits |
| Disk | %used, iowait, await | cleanup, expand, tiering |
| Network | bandwidth, errors, drops | LB, NIC, fw |

**Правило:** планировать действие **до** стабильных 80% (не ждать 95%).

Связь: [linux-intermediate/29-performance](../linux-intermediate/29-performance.md).

```bash
df -h
free -h
uptime
vmstat 1 3
```

---

## Runbook — структура

1. **Metadata** — title, severity, owner, last reviewed
2. **Symptoms** — алерт, жалоба пользователя
3. **Impact** — кто/что затронуто
4. **Diagnosis** — команды copy-paste
5. **Mitigation** — быстрый фикс
6. **Escalation** — кого звать
7. **Post-incident** — ticket, blameless review

Шаблон отчёта: [postgresql-ops/templates/incident-report.md](../postgresql-ops/templates/incident-report.md) (если есть в repo).

---

## Пример: disk full (фрагмент)

**Symptoms:** `node_filesystem_avail_bytes` < 10%, `No space left on device`.

**Diagnosis:**

```bash
df -h
df -i
du -xhd1 /var | sort -h | tail -10
journalctl --disk-usage
docker system df 2>/dev/null
```

**Mitigation:** vacuum journal, rotate logs, expand LV — см. [лабу 24](24-runbook-lab.md).

---

## On-call

| Severity | Пример | Реакция |
|----------|--------|---------|
| SEV1 | prod down | немедленно, все hands |
| SEV2 | деградация | 15–30 min |
| SEV3 | non-prod | рабочие часы |

Коммуникация: статус-канал, timeline, не «чиним молча».

---

## Типичные ошибки

| Ошибка | Риск |
|--------|------|
| runbook без команд | паника |
| только mitigation, нет root cause | повтор |
| scale без метрик | деньги + тот же bottleneck |
| runbook устарел | неверные пути |

---

## В продакшене

Runbooks в git рядом с кодом. Тест runbook на game day. SLO/SLI из error budget.

---

## Резюме

**Capacity** — тренды и пороги. **Runbook** — воспроизводимые шаги. **Post-incident** — улучшение документации.

## Чек-лист

- [ ] Что в runbook для «disk full»?
- [ ] Когда scale horizontal vs vertical?
- [ ] Какие 3 команды diagnosis для disk?

Следующий урок: [24. Лаба: runbook](24-runbook-lab.md).
