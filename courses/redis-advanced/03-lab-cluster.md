# 03. Лаба: Redis Cluster (7001-7006)

## Цель лабы

Поднять **6-нодовый** Cluster на Docker, выполнить `init-cluster.sh`, убедиться в **hash slots**, **MOVED redirects**, **failover** реплики и записать наблюдения в [`examples/cluster-notes.md`](examples/cluster-notes.md).

## Предварительно

- [02. Redis Cluster](02-cluster.md).
- Docker, `bash` (Git Bash / WSL на Windows).
- Остановите другие compose из `deploy/redis` ([README стенда](../../deploy/redis/README.md)).

```bash
cd deploy/redis
docker compose down 2>/dev/null || true
docker compose -f docker-compose.cluster.yml up -d
bash scripts/init-cluster.sh
```

---

## Подготовка стенда

```bash
docker compose -f docker-compose.cluster.yml ps
redis-cli -c -p 7001 PING
redis-cli -c -p 7001 CLUSTER INFO
```

**Что увидите:** `cluster_state:ok`, `cluster_slots_assigned:16384`.

**Если `cluster_state:fail`:** подождите healthcheck; повторите `init-cluster.sh`; проверьте логи `docker logs mock-redis-cluster-1`.

---

## Задание 1. Топология

**Зачем:** понимать, кто master, кто replica.

```bash
redis-cli -c -p 7001 CLUSTER NODES
```

Сохраните в `cluster-notes.md`: три строки `master` и три `slave`, привязка `replicates`.

**Критерий:** можете назвать master для слота `9999` (команда ниже).

```bash
redis-cli -p 7001 CLUSTER KEYSLOT test:9999
redis-cli -c -p 7001 CLUSTER GETKEYSINSLOT <slot> 1
```

---

## Задание 2. Запись и redirect

**Зачем:** увидеть работу `redis-cli -c`.

```bash
redis-cli -c -p 7001 SET lab:user:1 alice
redis-cli -c -p 7001 GET lab:user:1
redis-cli -p 7001 CLUSTER KEYSLOT lab:user:1
```

Повторите с **другого** порта (например `7004`):

```bash
redis-cli -c -p 7004 GET lab:user:1
```

**Что увидите:** клиент с `-c` сам перенаправит на нужный master.

**Без `-c`:** возможен ответ `MOVED ...` — зафиксируйте полный текст в notes.

---

## Задание 3. Hash tag

**Зачем:** multi-key в одном slot.

```bash
redis-cli -c -p 7001 MSET order:{lab99}:hdr "v1" order:{lab99}:lines "[]"
redis-cli -c -p 7001 MGET order:{lab99}:hdr order:{lab99}:lines
```

Сравните слоты:

```bash
redis-cli -p 7001 CLUSTER KEYSLOT order:{lab99}:hdr
redis-cli -p 7001 CLUSTER KEYSLOT order:lab99:hdr
```

**Что увидите:** с `{}` — один slot; без tag — слоты могут различаться.

---

## Задание 4. Отказ master (учебный)

**Зачем:** увидеть failover (~5-15 с на стенде).

1. Найдите master для ключа `lab:failover:test` (запишите node id).
2. Запишите значение:

```bash
redis-cli -c -p 7001 SET lab:failover:test ok-before
```

3. Остановите **контейнер** этого master (имя из `docker ps`, например `mock-redis-cluster-2`):

```bash
docker stop mock-redis-cluster-2
sleep 8
redis-cli -c -p 7001 GET lab:failover:test
redis-cli -c -p 7001 CLUSTER NODES | grep failover
```

4. Верните ноду:

```bash
docker start mock-redis-cluster-2
sleep 5
redis-cli -c -p 7001 CLUSTER NODES | grep redis-2
```

**Что увидите:** после timeout — новый master для слота; данные **обычно** сохранены (async repl). Краткий период `CLUSTERDOWN` допустим.

**Если ключ пропал:** реплика не успела синхронизировать — обсудите риск async replication.

---

## Задание 5. Документация

Заполните [`examples/cluster-notes.md`](examples/cluster-notes.md): таблица портов, вывод `CLUSTER INFO`, один пример MOVED, время failover.

---

## Критерии успеха

- [ ] `cluster_state:ok`, 16384 slots assigned.
- [ ] `SET`/`GET` через `-c` с любого порта 7001-7006.
- [ ] Hash tag `{lab99}` — `MGET` без `CROSSSLOT`.
- [ ] После `docker stop` master — чтение ключа снова работает.
- [ ] `cluster-notes.md` заполнен.

---

## Если не работает

| Симптом | Решение |
|---------|---------|
| `Connection refused` на 700x | `docker compose -f docker-compose.cluster.yml ps` |
| `Cluster isn't configured` | `bash scripts/init-cluster.sh` |
| `NOAUTH` | На стенде ACL выключен; в проде — см. [07](07-security.md) |
| Windows без bash | Git Bash: `bash scripts/init-cluster.sh` |

**Дальше:** [04. Hot keys](04-hot-keys-stampede.md).
