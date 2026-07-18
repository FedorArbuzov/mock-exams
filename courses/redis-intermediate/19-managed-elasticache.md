# 19. Managed Redis: Amazon ElastiCache

## Введение: «подняли Redis на EC2 — забыли патчить, упали по OOM»

Self-hosted Redis ([deploy/redis](../../deploy/redis/README.md), Sentinel, Cluster) даёт контроль, но **вы** — SRE: патчи, failover, бэкапы, мониторинг. **Amazon ElastiCache** — managed Redis (и Memcached): AWS управляет хостами, Multi-AZ failover, снимками и интеграцией с VPC.

Теория этой главы опирается на [aws-basic: базы данных](../aws-basic/07-databases.md) (раздел ElastiCache).

## Что вы узнаете

- Когда ElastiCache вместо EC2/Docker Redis.
- Режимы: single node, replication group, Multi-AZ.
- Сеть: subnet group, security groups.
- Параметры, бэкапы, обновления.
- Отличия от учебного Sentinel-стенда.

## Managed vs self-hosted

| | Self-hosted (курс) | ElastiCache |
|--|-------------------|-------------|
| Failover | Sentinel / ручной | Multi-AZ automatic |
| Патчи | вы | maintenance window |
| Бэкапы | BGSAVE + S3 скрипт | snapshots, PITR (зависит от версии) |
| Масштаб RAM | миграция VM | vertical scale, shard (cluster mode) |
| Стоимость | EC2 + ваше время | premium за managed |

## Топология

```text
App (private subnet, ECS/EKS/EC2)
    → Security Group: TCP 6379 от app-sg
    → ElastiCache Replication Group
          Primary (write)
          Replica(s) (read, AZ failover)
```

**Subnet group** — только указанные private subnets.  
**Security group** — не открывать 6379 в `0.0.0.0/0`.

Связь с VPC из [aws-basic 04](../aws-basic/04-vpc-networking.md): Redis **не** в public subnet.

## Режимы

| Режим | Use case |
|-------|----------|
| Single node | dev/test |
| Replication group + 1 replica | prod read scale |
| Multi-AZ | auto failover primary |
| Cluster mode enabled | шардирование, > RAM одного узла |

Учебный [`docker-compose.sentinel.yml`](../../deploy/redis/docker-compose.sentinel.yml) ≈ **логика** replication group + Sentinel, но без AWS API.

## Параметры и совместимость

- **Parameter group**: `maxmemory-policy`, `timeout`, `notify-keyspace-events`.
- Версия engine — совместимость с клиентом (`redis-py`, Lettuce).
- **AUTH token** + **RBAC** (пользователи ACL в облаке) — аналог [09-acl](09-acl.md).

## Бэкапы и восстановление

| Возможность | Смысл |
|-------------|--------|
| Snapshot | ручной/автоматический RDB-подобный снимок |
| Backup window | низкая нагрузка |
| Restore в новый cluster | DR drill |

Соответствует практикам из [18-lab-backup](18-lab-backup.md), но через консоль/Terraform.

## Мониторинг

CloudWatch:

- `CPUUtilization`
- `DatabaseMemoryUsagePercentage`
- `CurrConnections`
- `ReplicationLag` (для replica)
- `Evictions` (при вытеснении)

Аналоги `INFO` и SLOWLOG — [15-monitoring](15-monitoring.md); в AWS можно включить **Slow Log** delivery в CloudWatch Logs.

## Когда Redis, когда DynamoDB/RDS

Из [07-databases](../aws-basic/07-databases.md):

| Задача | Сервис |
|--------|--------|
| Кэш, сессии, rate limit, pub/sub | ElastiCache Redis |
| Очередь TB, replay | MSK (Kafka) |
| Primary transactional DB | RDS/Aurora |
| Key-value без Redis-API | DynamoDB |

Не храните в Redis **единственную** копию заказов — cache aside: запись в RDS, инвалидация кэша.

## Миграция с учебного стенда

1. Поднять replication group в private subnet.
2. Экспорт данных: `BGSAVE` / RIOT / redis-shake (для больших объёмов).
3. Переключить `REDIS_URL` в приложении, включить TLS.
4. Нагрузочный тест и failover drill в maintenance window.

## Типичные ошибки

| Симптом | Причина | Решение |
|---------|---------|---------|
| Timeout из app | SG / subnet | 6379 от app-sg, same VPC |
| Потеря данных | Redis как primary DB | RDS + cache |
| Высокий bill | oversized node | rightsizing, cluster shards |
| Stale cache | нет TTL/инвалидации | TTL, pub/sub invalidation |
| AUTH failed | token rotation | Secrets Manager |

## Резюме

ElastiCache переносит операции Sentinel/backup/патчей в AWS. Концепции курса (replication, ACL, memory, slowlog) **те же**; меняется панель управления и интеграция с VPC/IAM.

## Чек-лист

- Где в VPC должен жить ElastiCache?
- Чем replication group отличается от single node?
- Какой CloudWatch метрикой ловить заполнение памяти?
- Почему кэш не заменяет Postgres?

Следующий урок: [20. Финальный проект](20-final-project.md).
