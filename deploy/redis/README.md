# Redis для курсов redis-*

Локальный стенд для [redis-basic](../../courses/redis-basic/README.md), [redis-intermediate](../../courses/redis-intermediate/README.md), [redis-advanced](../../courses/redis-advanced/README.md).

## Запуск (один инстанс)

```bash
cd deploy/redis
docker compose up -d
docker compose ps
```

| Сервис | URL / порт |
|--------|------------|
| Redis (с хоста) | `localhost:6379` |
| Redis (из Docker) | `redis:6379` |
| Redis Commander | [http://localhost:8081](http://localhost:8081) |

Дождитесь **healthy** у `mock-redis`.

## Smoke test

```bash
bash scripts/smoke.sh
# Windows:
# .\scripts\smoke.ps1
```

## redis-cli

С хоста (если установлен `redis-cli`):

```bash
redis-cli -h localhost -p 6379 ping
```

В контейнере:

```bash
docker exec -it mock-redis redis-cli
```

Полезные команды: `INFO`, `INFO memory`, `SCAN 0 MATCH 'app:*' COUNT 100`, `MONITOR`, `SLOWLOG GET 10`.

## Репликация (intermediate)

```bash
docker compose -f docker-compose.replication.yml up -d
```

| Роль | С хоста |
|------|---------|
| Master (запись) | `localhost:6379` |
| Replica (чтение) | `localhost:6380` |

Проверка: `docker exec mock-redis-master redis-cli INFO replication`

## Sentinel (intermediate)

```bash
docker compose -f docker-compose.sentinel.yml up -d
```

| Сервис | Порт |
|--------|------|
| Master (начальный) | `6379` |
| Sentinel | `26379` |

Узнать текущий master:

```bash
redis-cli -p 26379 SENTINEL get-master-addr-by-name mymaster
```

## Cluster (advanced)

```bash
docker compose -f docker-compose.cluster.yml up -d
bash scripts/init-cluster.sh
```

С хоста (cluster mode):

```bash
redis-cli -c -p 7001 cluster info
redis-cli -c -p 7001 SET user:1 alice
```

## Сброс данных

```bash
docker compose down -v
```

Для replication/sentinel/cluster — аналогично с `-f` нужного compose-файла.

## Troubleshooting

| Симптом | Что проверить |
|---------|----------------|
| `DENIED Redis is running in protected mode` | В лаб-стенде `protected-mode no`; в проде — bind + ACL |
| OOM / `OOM command not allowed` | `INFO memory`, `maxmemory`, eviction policy |
| Replica не догоняет | `INFO replication`, lag, сеть между контейнерами |
| Cluster `CLUSTERDOWN` | `init-cluster.sh`, все 6 узлов healthy |
| Порт занят | `6379`, `8081` или `7001-7006` |

## Переключение стендов

Перед сменой compose остановите предыдущий проект:

```bash
docker compose down
docker compose -f docker-compose.replication.yml down
```

Иначе конфликт портов `6379` / `8081`.
