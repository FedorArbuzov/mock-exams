# 06. Лаба: автоматический failover через Sentinel

## Цель лабы

Поднять [`docker-compose.sentinel.yml`](../../deploy/redis/docker-compose.sentinel.yml), записать данные, **убить master**, дождаться failover и найти **новый** master через Sentinel.

## Предварительно

```bash
cd deploy/redis
docker compose down
docker compose -f docker-compose.replication.yml down 2>/dev/null || true
docker compose -f docker-compose.sentinel.yml up -d
```

Подождите ~30 с, пока Sentinel выберут master.

```bash
redis-cli -p 26379 PING
redis-cli -p 26379 SENTINEL master mymaster
```

---

## Задание 1. Текущий master

```bash
redis-cli -p 26379 SENTINEL get-master-addr-by-name mymaster
redis-cli -p 6379 SET lab:sentinel:order 42
redis-cli -p 6379 GET lab:sentinel:order
```

Запишите **имя контейнера** master (из `docker ps` — обычно `mock-redis-sentinel-master`).

---

## Задание 2. Список Sentinel и replicas

```bash
redis-cli -p 26379 SENTINEL sentinels mymaster
redis-cli -p 26379 SENTINEL replicas mymaster
```

**Что увидите:** два replica, три sentinel (часть без проброса порта на хост — норма).

---

## Задание 3. Падение master

```bash
docker stop mock-redis-sentinel-master
```

Наблюдайте логи Sentinel:

```bash
docker logs mock-redis-sentinel-1 --tail 30
```

Через **5–60 с** (зависит от `down-after` и failover):

```bash
redis-cli -p 26379 SENTINEL get-master-addr-by-name mymaster
```

**Что увидите:** IP/имя **другой** реплики как master (порт 6379 внутри сети Docker).

Проверка данных на новом master (подключитесь к хосту, если порт проброшен у новой роли — часто нужен exec):

```bash
docker exec mock-redis-sentinel-replica-1 redis-cli GET lab:sentinel:order
# или replica-2 — смотрите вывод get-master-addr-by-name
```

---

## Задание 4. Запись после failover

Узнайте контейнер-новый-master из `docker ps` и:

```bash
docker exec <new-master-container> redis-cli SET lab:sentinel:after-failover ok
docker exec <new-master-container> redis-cli GET lab:sentinel:after-failover
```

---

## Задание 5. События (+switch-master)

```bash
docker logs mock-redis-sentinel-1 2>&1 | grep -i switch
```

**Что увидите:** строка о переключении master (`+switch-master`).

---

## Задание 6. Сброс

```bash
docker compose -f docker-compose.sentinel.yml down -v
```

---

## Критерии успеха

| # | Критерий |
|---|----------|
| 1 | До падения ключ `lab:sentinel:order` читается |
| 2 | После stop старого master Sentinel выдаёт новый адрес |
| 3 | Данные сохранились на promote replica |
| 4 | В логах есть признак failover |
| 5 | Объяснили разницу с ручным `REPLICAOF NO ONE` |

## Если не работает

| Симптом | Действие |
|---------|----------|
| `Could not connect to Sentinel` | `docker ps`, порт `26379`, подождать 60 с |
| Master не меняется | quorum: нужны 2 из 3 Sentinel живы |
| Порт 6379 молчит после failover | подключайтесь через `docker exec` к контейнеру из `get-master-addr-by-name` |

Следующий урок: [07. Streams](07-streams.md).
