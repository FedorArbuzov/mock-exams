# 07. Лаба: сети frontend/backend и proxy

## Цель лабы

Проверить **DNS** между сервисами, **недоступность redis с хоста**, работу **nginx `/api/`** и membership в сетях compose.

## Предварительно

```bash
cd deploy/containers
docker compose up -d --build
bash scripts/smoke.sh
```

Теория: [06. Сети](06-networking.md). Сниппет: [`examples/compose-snippet.yml`](examples/compose-snippet.yml).

---

## Задание 1. Список сетей

```bash
docker network ls --filter name=containers
docker compose ps
```

**Что увидите:** сети `…_frontend`, `…_backend` (префикс = имя проекта compose).

---

## Задание 2. Redis с хоста (должен fail)

```bash
docker run --rm redis:7.2-alpine redis-cli -h host.docker.internal -p 6379 ping 2>/dev/null || \
  nc -zv 127.0.0.1 6379 2>&1 || echo "expected: no redis on host"
```

**Что увидите:** connection refused / timeout — redis **не** опубликован.

---

## Задание 3. Redis из api

```bash
docker exec mock-containers-api sh -c 'getent hosts redis; nc -zv redis 6379'
```

**Что увидите:** IP redis в backend-сети; `open`.

---

## Задание 4. Web → api (без порта api на хосте)

```bash
docker exec mock-containers-web wget -qO- http://api:8080/health
```

**Что увидите:** JSON `{"status":"ok"}`.

---

## Задание 5. Web не видит redis (ожидаемо)

```bash
docker exec mock-containers-web sh -c 'wget -qO- --timeout=2 http://redis:6379 2>&1' || echo "expected fail"
```

**Что увидите:** timeout / bad address — web **не** в `backend`.

---

## Задание 6. Путь через хост :8088

```bash
curl -s http://localhost:8088/api/health
curl -s http://localhost:8088/api/hits
curl -s http://localhost:8088/api/hits
```

**Что увидите:** `hits` растёт: 1, 2, …

---

## Задание 7. Inspect membership

```bash
NET=$(docker inspect mock-containers-api --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}')
echo "$NET"
docker network inspect $(echo "$NET" | awk '{print $1}') --format '{{range .Containers}}{{.Name}} {{end}}'
```

**Что увидите:** в backend — `mock-containers-api`, `mock-containers-redis`; web только в frontend.

---

## Задание 8. Сломать proxy (опционально, откатить)

Временно в `stack/web/nginx.conf` уберите trailing `/` у `proxy_pass`, пересоберите web:

```bash
docker compose up -d --build web
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8088/api/health
```

**Что увидите:** часто **404** — верните конфиг как было.

---

## Критерии успеха

- [ ] Redis недоступен с `127.0.0.1:6379`
- [ ] api резолвит и пингует redis
- [ ] web достаёт api по имени `api`
- [ ] `/api/hits` через localhost:8088 увеличивает счётчик
- [ ] inspect подтверждает две сети у api

## Что унести в работу

- Внутри compose **service name = hostname**
- Не публиковать data tier на хост
- Один вход через reverse proxy

Следующий урок: [08. Тома](08-volumes.md).
