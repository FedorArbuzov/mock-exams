# Cluster notes — шаблон для лаб и capstone

Заполните во время [03-lab-cluster](../03-lab-cluster.md) и [18-capstone](../18-capstone.md).

## Стенд

| Параметр | Значение |
|----------|----------|
| Compose file | `deploy/redis/docker-compose.cluster.yml` |
| Init script | `deploy/redis/scripts/init-cluster.sh` |
| Дата | |
| ОС / Docker | |

## CLUSTER INFO (после init)

```text
# вставьте вывод: redis-cli -c -p 7001 CLUSTER INFO
```

| Поле | Значение |
|------|----------|
| cluster_state | |
| cluster_slots_assigned | |
| cluster_known_nodes | |
| cluster_size | |

## Топология NODES

| Node | Роль | Node ID (кратко) | Replicates |
|------|------|------------------|------------|
| redis-1:6379 | | | |
| redis-2:6379 | | | |
| redis-3:6379 | | | |
| redis-4:6379 | | | |
| redis-5:6379 | | | |
| redis-6:6379 | | | |

## Пример MOVED (без -c)

```text
# redis-cli -p 7001 SET test:moved 1
# (ответ MOVED ...)
```

## Hash tag

| Ключ | Slot |
|------|------|
| `order:{lab99}:hdr` | |
| `order:lab99:hdr` | |

## Failover lab

| Метрика | Значение |
|---------|----------|
| Остановленный контейнер | |
| Время до восстановления GET | ~ с |
| Потеря данных? | да / нет |

## Stampede / jitter (lab 05)

- Параллельных miss без lock: 
- С lock / jitter вывод: 

## Security checklist (capstone)

- [ ] SG: 6379 только app subnet
- [ ] ufw/nftables ([firewall](../../linux-intermediate/07-firewall.md))
- [ ] ACL default off
- [ ] FLUSHALL / DEBUG отключены
- [ ] TLS в prod

## Runbook: high latency

1. 
2. 
3. 

## Runbook: OOM

1. 
2. 
3. 

## Заметки

_Свободное поле для инцидентов, вопросов интервьюера, идей._
