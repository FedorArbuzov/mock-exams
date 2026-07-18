# 04. Лаба: репликация и ручной failover

## Цель лабы

Поднять стенд **master + replica**, проверить репликацию данных, симулировать падение master и выполнить **ручной promote** replica в новый master.

## Предварительно

```bash
cd deploy/redis
docker compose down
docker compose -f docker-compose.replication.yml up -d
docker compose -f docker-compose.replication.yml ps
```

Оба Redis и Commander — **Up**.

---

## Задание 1. Карта стенда

**Зачем:** не перепутать порты.

| Подключение | Порт | Роль |
|-------------|------|------|
| `redis-cli -p 6379` | 6379 | master |
| `redis-cli -p 6380` | 6380 | replica (внутри контейнера 6379) |

```bash
docker exec mock-redis-master redis-cli INFO server | grep redis_version
docker exec mock-redis-replica redis-cli INFO replication | grep -E 'role|master_host|master_link_status'
```

**Что увидите:** `role:slave`/`replica`, `master_host:redis-master`, `master_link_status:up`.

---

## Задание 2. Запись на master, чтение с replica

```bash
redis-cli -p 6379 SET lab:repl:order:1001 '{"status":"paid"}'
redis-cli -p 6379 INCR lab:repl:counter
sleep 1
redis-cli -p 6380 GET lab:repl:order:1001
redis-cli -p 6380 GET lab:repl:counter
```

**Что увидите:** те же значения на replica.

Попытка записи на replica:

```bash
redis-cli -p 6380 SET lab:repl:hack 1
```

Ожидается **READONLY**.

---

## Задание 3. Offset и lag

```bash
docker exec mock-redis-master redis-cli INFO replication | grep -E 'master_repl_offset|connected_slaves'
docker exec mock-redis-replica redis-cli INFO replication | grep -E 'slave_repl_offset|master_repl_offset'
```

Запишите 100 ключей:

```bash
for i in $(seq 1 100); do redis-cli -p 6379 SET "lab:repl:bulk:$i" $i; done
docker exec mock-redis-replica redis-cli DBSIZE
```

**Что увидите:** размер БД на replica совпадает (или ±1 при гонке).

---

## Задание 4. Симуляция падения master

**Зачем:** отработать DR без Sentinel.

```bash
docker stop mock-redis-master
redis-cli -p 6380 GET lab:repl:order:1001
```

Данные на replica **есть**, но новые записи на master невозможны.

---

## Задание 5. Ручной promote

На replica (порт 6380 с хоста):

```bash
redis-cli -p 6380 REPLICAOF NO ONE
redis-cli -p 6380 INFO replication | grep role
redis-cli -p 6380 SET lab:repl:promoted 1
```

**Что увидите:** `role:master`, запись успешна.

Зафиксируйте в блокноте: **новый master слушает 6380** (в реальности обновили бы DNS/load balancer).

---

## Задание 6. (Опционально) Поднять старый master как replica

```bash
docker start mock-redis-master
sleep 3
docker exec mock-redis-master redis-cli REPLICAOF host.docker.internal 6380
```

На Linux `host.docker.internal` может не работать — используйте IP хоста или пересоздайте compose. Для курса достаточно заданий 1–5.

---

## Задание 7. Сброс стенда

```bash
docker compose -f docker-compose.replication.yml down
```

Перед лабами Sentinel/single — убедитесь, что порты свободны.

---

## Критерии успеха

| # | Критерий |
|---|----------|
| 1 | Данные с master видны на `6380` |
| 2 | Запись на replica отклоняется |
| 3 | После stop master replica всё ещё отдаёт ключи |
| 4 | После `REPLICAOF NO ONE` replica принимает `SET` |
| 5 | Понимаете, почему приложению нужен новый endpoint |

Следующий урок: [05. Sentinel](05-sentinel.md).
