# 01. Patroni и автоматический failover

## Сценарий с работы

Primary упал в 02:14. Дежурный вручную делает `pg_promote()` на «самой свежей» replica — но вторая replica тоже получила promote от другого админа. Два primary, split-brain, заказы пишутся в разные вселенные. Через час — merge данных вручную и postmortem.

**Patroni** + **DCS** (etcd/Consul) решают: кто единственный leader, автоматический failover, health checks. Это следующий шаг после ручной streaming replication ([intermediate/05-streaming-replication](../postgresql-intermediate/05-streaming-replication.md)).

## Что вы узнаете

- Почему ручной promote опасен
- Архитектуру Patroni + DCS + HAProxy
- Sync vs async replication в HA
- Альтернативы: pg_auto_failover, managed RDS Multi-AZ

## Проблема ручного failover

| Вопрос | Без оркестратора |
|--------|------------------|
| Кто promote? | Человек под стрессом |
| Какая replica свежее? | Сравнение LSN вручную |
| Два primary? | Возможен split-brain |
| Когда переключить DNS? | Не согласовано с app |

Streaming replica ([intermediate/06](../postgresql-intermediate/06-lab-streaming-replication.md)) даёт копию данных; **Patroni** даёт **процесс** выбора leader.

## Архитектура Patroni

```text
              etcd / Consul (DCS — quorum 3+ nodes)
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
       Node AZ-a     Node AZ-b     Node AZ-c
       Patroni       Patroni       Patroni
       PostgreSQL    PostgreSQL    PostgreSQL
       (leader)      (replica)     (replica)
          │             │             │
          └─────────────┴─────────────┘
                        │
                   HAProxy / VIP
                   (single write endpoint)
                        │
                     App pods
```

| Компонент | Роль |
|-----------|------|
| **DCS** | Distributed lock «кто leader»; etcd нужен **quorum** (3, 5 nodes — не 2) |
| **Patroni** | Управляет Postgres: start/stop, replicate config, failover |
| **PostgreSQL** | Данные; leader read/write, replicas hot standby |
| **HAProxy** | Маршрутизация: writes → leader, reads → replicas (опционально) |

Leader держит lock в DCS. Patroni на replica видит: leader dead → acquire lock → `pg_promote()` → обновить endpoint.

Типичный failover: **30–60 сек** (tunable: `ttl`, `loop_wait`, health checks).

## Split-brain — как Patroni снижает риск

Split-brain: два узла считают себя primary. Patroni:

1. Только один holder lock в DCS.
2. Старый leader при partition теряет lock по TTL.
3. `nofailover`, `noloadbalance` tags для maintenance nodes.

**Не панацея:** при потере quorum DCS кластер не выберет leader — лучше read-only, чем два primary.

## HAProxy / VIP / DNS

Приложение **не** должно хранить IP primary в ConfigMap навсегда.

| Подход | Плюс | Минус |
|--------|------|-------|
| HAProxy + health check | Быстрое переключение | Ещё один слой |
| Virtual IP (keepalived) | Прозрачный IP | Сложнее в cloud |
| DNS TTL 30–60s | Просто | Задержка при failover |
| K8s Service (CNPG) | Нативно в K8s | Привязка к платформе |

PgBouncer ([intermediate/15-pgbouncer](../postgresql-intermediate/15-pgbouncer.md)) перед HAProxy — типичный стек.

## Синхронная репликация в HA

```sql
synchronous_standby_names = 'FIRST 1 (patroni-node2, patroni-node3)'
```

| | Async | Sync (1 standby) |
|---|-------|------------------|
| RPO при падении leader | До lag | ~0 |
| Commit latency | Ниже | Ждёт flush на replica |
| Риск | Потеря последних tx | Leader ждёт медленную replica |

Patroni `synchronous_mode` координирует с DCS. Для финансов — sync; для многих SaaS — async + приемлемый RPO.

## Альтернативы

| Решение | Когда |
|---------|-------|
| **pg_auto_failover** | Проще Patroni, меньше компонентов |
| **RDS Multi-AZ** | AWS managed ([13-cloud-k8s](13-cloud-k8s.md)) |
| **CloudNativePG** | Postgres operator в Kubernetes ([14-lab-cloudnativepg](14-lab-cloudnativepg.md)) |
| **Citus** | Distributed/sharding, не классический HA |

## Типичные ошибки

1. etcd на 2 nodes — нет quorum при падении одного.
2. App подключается напрямую к IP primary — нет failover endpoint.
3. Sync replica в другом регионе — commit latency 200ms+.
4. Failover без проверки lag — promote отстающей replica.

## Чек-лист

- [ ] Зачем DCS (lock, не «хранить конфиг» только)
- [ ] Split-brain и роль TTL
- [ ] HAProxy vs direct to primary
- [ ] Sync replication tradeoff (RPO vs latency)
- [ ] Quorum etcd — почему не 2 nodes

## Дальше

Лаба-архитектура: [02-lab-patroni.md](02-lab-patroni.md).
