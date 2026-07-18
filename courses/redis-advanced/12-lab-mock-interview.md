# 12. Лаба: mock interview — 45 минут

## Цель

Симуляция technical interview: **15 мин** rapid-fire, **20 мин** system design lite, **10 мин** ваши вопросы интервьюеру. Партнёр или таймер + запись голоса.

## Предварительно

- [11-interview-qa](11-interview-qa.md) и [interview-cheatsheet](interview-cheatsheet.md) — прочитаны **до** сессии.
- Лист / whiteboard.

---

## Раунд 1 — Rapid fire (15 мин)

10 вопросов, **30 секунд** на ответ вслух:

1. Почему Redis однопоточный и как масштабировать?
2. MOVED vs ASK?
3. `noeviction` vs `allkeys-lru`?
4. Sentinel quorum — зачем 3?
5. Async replication — что потеряем при failover?
6. Почему `KEYS *` опасен?
7. Cache stampede — 2 mitigation?
8. Redlock — когда не использовать?
9. ACL `~app:*` — что означает?
10. Hot key в Cluster — почему 6 нод не помогают?

**Оценка:** ≥7/10 без шпаргалки — pass.

---

## Раунд 2 — System design lite (20 мин)

**Промпт:** «Маркетплейс: каталог 2M SKU, 50k RPS read, пики x3. Сессии 500k online. Redis в EU, PG — source of truth».

Нарисуйте:

- cache-aside flow;
- оценка RAM (порядок величины);
- standalone vs Cluster vs ElastiCache;
- TTL / eviction;
- session keys pattern;
- hot key mitigation (1 SKU);
- 3 метрики алертов;
- security (1 фраза).

**Rubric:**

| 0 | 1 | 2 |
|---|---|---|
| Нет sizing | RAM ≈ dataset × overhead | + replica/COW headroom |
| Один инстанс «навсегда» | Cluster при RAM/CPU | + hash tags / sharding |
| Нет stampede | Упомянут jitter | + singleflight |
| Публичный 6379 | Private + ACL | + TLS + firewall |

≥6/8 — pass. Эталон: [14-lab-system-design](14-lab-system-design.md).

---

## Раунд 3 — Ваши вопросы (10 мин)

Подготовьте 3 вопроса компании:

- Какой Redis (OSS, ElastiCache, MemoryDB, Valkey)?
- Кто on-call и SLO на cache?
- Были ли инциденты hot key / OOM?

---

## Домашнее задание

Пересмотрите запись: слова-паразиты, «э-э» вместо структуры **requirement → estimate → diagram → trade-off**.

**Дальше:** [13. System design](13-system-design.md).
