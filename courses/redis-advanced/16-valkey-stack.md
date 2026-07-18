# 16. Valkey и Redis Stack

## Введение: лицензия и «что ставить в 2026»

После смены лицензии Redis Ltd часть индустрии перешла на **Valkey** (Linux Foundation) как OSS-совместимый форк. **Redis Stack** (модули: Search, JSON, Bloom, TimeSeries) — отдельный продуктовый путь. На собеседовании ждут: **протокол RESP совместим**, но **операционные** и **юридические** различия вы знаете.

## Что вы узнаете

- **Valkey** vs Redis OSS vs Enterprise.
- **Redis Stack** модули — когда нужны.
- Managed: **ElastiCache**, **MemoryDB**, **Azure Cache**.
- Миграция и риски клиентов.

---

## Valkey

| Аспект | Деталь |
|--------|--------|
| Происхождение | Fork Redis 7.2 после license change |
| Протокол | Совместим с redis-cli, большинством клиентов |
| Governance | Linux Foundation, AWS/Google/Oracle участники |
| Версии | Следят за feature parity; проверять release notes |

**Ops:** те же playbook — replication, Cluster, ACL. Образы Docker: `valkey/valkey`.

```bash
docker run --rm valkey/valkey:8 valkey-cli PING
```

**На собеседовании:** «Что изменится в приложении?» — обычно **ничего**, если нет Redis Ltd proprietary modules.

---

## Redis Stack (модули)

| Module | Use case |
|--------|----------|
| RedisJSON | Документ в одном ключе, JSONPath |
| RediSearch | Full-text, secondary indexes |
| RedisBloom | Bloom / Cuckoo filter |
| RedisTimeSeries | Метрики, downsampling |

Когда **не** нужен Stack:

- Простой cache-aside — strings/hashes достаточно.
- Full-text — Elasticsearch/OpenSearch может быть проще в команде.

Когда **нужен:**

- Low-latency search на горячих данных уже в Redis.
- Probabilistic filter (`BF.ADD`) для cache penetration.

---

## Managed services

| Сервис | Особенность |
|--------|-------------|
| ElastiCache Redis/Valkey | Cluster mode, Multi-AZ, auth token |
| MemoryDB | Redis-compatible, **durable** log-first |
| Confluent — N/A | — |
| Azure Cache for Redis | Enterprise tiers с modules |

**MemoryDB vs ElastiCache:** MemoryDB — когда Redis как **primary** store с durability; ElastiCache — классический cache.

---

## Миграция

1. Бенчмарк staging (latency, memory).
2. Проверить **modules** и **ACL**.
3. Rolling replace replicas → failover master.
4. Клиенты: redisson, lettuce — версии с Valkey tested.

---

## Резюме

1. **Valkey** — OSS альтернатива с тем же протоколом.
2. **Stack** — модули, не обязательны для cache-only.
3. Managed снимает **patching/failover**, не **key design**.

**Дальше:** [17. K8s operators](17-k8s-operators.md).
