# 18. Capstone: production-like Redis platform

## Цель проекта (4–6 часов)

Собрать **документированную** мини-платформу: Redis Cluster на стенде, cache-aside demo, security hardening checklist, runbook OOM/latency, mock **system design** doc — как артефакт для портфолио и интервью.

## Предварительно

Пройдены главы **01–17** или эквивалент intermediate + этот README.

Стенд:

```bash
cd deploy/redis
docker compose -f docker-compose.cluster.yml up -d
bash scripts/init-cluster.sh
```

---

## Часть A — Cluster operations (90 мин)

1. Заполните [`examples/cluster-notes.md`](examples/cluster-notes.md) полностью.
2. Симулируйте failover одного master ([03-lab-cluster](03-lab-cluster.md)) — зафиксируйте RTO.
3. Создайте 1000 ключей `cap:sku:{1..1000}` через pipeline; проверьте распределение slots (выборочно 5 ключей).
4. Один ключ `cap:hot:banner` — `redis-cli --hotkeys` или `INFO commandstats` после 1000 `GET` в цикле.

**Deliverable:** `cluster-notes.md` + скрин/вывод `CLUSTER INFO`.

---

## Часть B — Application pattern (60 мин)

Напишите **псевдокод или скрипт** (Python/Go/bash) cache-aside:

- `GET cap:product:{id}`
- on miss: «load from DB» (sleep 0.1) + `SET EX 300`
- TTL jitter ±30s
- optional `SET lock:cap:product:{id} NX EX 10` on miss

Прогоните 20 параллельных запросов на один id — покажите, что lock уменьшает «DB calls».

**Deliverable:** файл `examples/cache-aside-demo.sh` (или описание в cluster-notes).

---

## Часть C — Security (45 мин)

1. Заполните checklist из [08-lab-rename-commands](08-lab-rename-commands.md) для prod.
2. Сопоставьте с [`examples/redis-security.conf`](examples/redis-security.conf).
3. Одним абзацем: как [linux-intermediate firewall](../linux-intermediate/07-firewall.md) дополняет SG.

**Deliverable:** раздел `## Security` в cluster-notes или отдельный `security-checklist.md` (опционально).

---

## Часть D — Runbooks (45 мин)

Два runbook по 5–7 шагов:

1. **High latency p99** ([09](09-troubleshooting.md))
2. **OOM / evictions** ([10](10-lab-oom-recovery.md))

**Deliverable:** разделы в cluster-notes.

---

## Часть E — System design (60 мин)

Оформите 1-2 страницы по шаблону [14-lab-system-design](14-lab-system-design.md) для **вашего** домена (игры, fintech, IoT — на выбор):

- sizing RAM
- topology
- hot key plan
- 3 alerts

**Deliverable:** `examples/system-design-capstone.md` (создайте сами).

---

## Часть F — Mock interview (30 мин)

Пройдите [12-lab-mock-interview](12-lab-mock-interview.md) с партнёром или записью.

**Deliverable:** самооценка ≥7/10 rapid-fire.

---

## Критерии приёмки

| Критерий | Вес |
|----------|-----|
| Cluster ok + failover documented | 25% |
| Cache-aside + anti-stampede | 20% |
| Security checklist | 15% |
| Runbooks | 20% |
| System design doc | 15% |
| Mock interview pass | 5% |

---

## Что сказать на интервью

«В capstone я поднял 6-node Cluster в Docker, провёл failover, задокументировал MOVED/ASK, реализовал cache-aside с jitter и lock, и написал runbook OOM/latency — вот repo path `courses/redis-advanced/examples/`.»

---

## Очистка

```bash
cd deploy/redis
docker compose -f docker-compose.cluster.yml down -v
```

Поздравляем — трек **redis-advanced** завершён. Повторите [`interview-cheatsheet.md`](interview-cheatsheet.md).
