# 02. Архитектура стенда: процессы, конфиг, compose

## Введение: три контейнера — одна точка входа

Стенд [`deploy/nginx`](../../deploy/nginx/README.md) моделирует продакшен-схему: с хоста доступен только **edge** (`localhost:8080` и `8443`), backends живут в сети **internal**. Вы правите конфиги на диске, монтируете их в `mock-nginx-edge`, проверяете **`nginx -t`** и делаете **reload** — без пересборки образа edge.

Эта глава — карта каталогов, процессов nginx и связи с Docker DNS. Практика vhost и статики — в [лабе 03](03-lab-vhost-static.md).

## Что вы узнаете

- Схему **edge → static / api**.
- **master / worker** внутри контейнера.
- Файлы `nginx.conf` и `conf.d/*.conf`.
- Имена сервисов compose как upstream.

## Топология

```text
Хост :8080, :8443
        │
   mock-nginx-edge (nginx:1.27-alpine)
        ├── /static/  → proxy_pass → mock-nginx-static:80
        ├── /api/     → proxy_pass → mock-nginx-api:8080
        └── /         → return 200 'edge OK'
```

| Контейнер | hostname | Порт внутри сети | Роль |
|-----------|----------|------------------|------|
| mock-nginx-edge | edge | 80, 443 | reverse proxy |
| mock-nginx-static | static | 80 | HTML из volume |
| mock-nginx-api | api | 8080 | `/health`, `/hits` |

Полный compose: [`docker-compose.yml`](../../deploy/nginx/docker-compose.yml). Логи edge пишутся в `deploy/nginx/logs/` на хост (bind mount).

## Процессы master и worker

Внутри контейнера edge:

```bash
docker compose exec mock-nginx-edge ps aux
```

Ожидаемо: один **master** (root) и несколько **worker** (user `nginx`). Master читает конфиг и открывает порты; workers обрабатывают соединения. Поэтому после правки конфига достаточно **reload** — workers перечитывают конфиг по сигналу, старые соединения дообслуживаются.

| Действие | Команда |
|----------|---------|
| Проверка синтаксиса | `docker compose exec mock-nginx-edge nginx -t` |
| Подхватить конфиг | `docker compose exec mock-nginx-edge nginx -s reload` |
| Логи | `docker compose logs -f edge` или `tail -f logs/error.log` |

На VM те же команды через `systemctl reload nginx` — см. [linux-intermediate/13](../linux-intermediate/13-nginx.md).

## Файлы конфигурации

```text
deploy/nginx/
├── config/
│   ├── nginx.conf          # http {}, log_format, include conf.d
│   └── conf.d/
│       ├── 00-default.conf # HTTP :80 — основные location
│       ├── 10-tls.conf     # HTTPS :443 (нужны certs)
│       └── 20-rate-limit.conf  # intermediate
├── certs/                  # server.crt после gen-certs.sh
├── logs/                   # access.log, error.log на хосте
└── backends/
    ├── static/html/
    └── api/
```

Главный файл [`nginx.conf`](../../deploy/nginx/config/nginx.conf):

- `worker_processes auto;`
- `include /etc/nginx/mime.types;`
- `access_log` / `error_log`
- `include /etc/nginx/conf.d/*.conf;`

Фрагмент HTTP edge — [`00-default.conf`](../../deploy/nginx/config/conf.d/00-default.conf). Порядок загрузки — **по имени файла** (`00` раньше `10`).

## Блок server и location

```nginx
server {
    listen 80;
    server_name localhost lab.local;

    location /static/ {
        proxy_pass http://static:80/;
        # ...
    }
}
```

| Директива | Назначение |
|-----------|------------|
| `listen 80` | порт внутри контейнера (на хосте 8080→80) |
| `server_name` | выбор vhost по заголовку Host |
| `location /static/` | префикс URI |
| `proxy_pass http://static:80/` | upstream по **имени сервиса** compose |

**static** и **api** — DNS-имена Docker в сети `internal`, не `127.0.0.1` на edge.

## Публикация портов

```yaml
edge:
  ports:
    - "8080:80"
    - "8443:443"
```

Только edge на хосте. Попытка `curl http://api:8080` **с ноутбука** не сработает — api не published. Проверка backend **из edge**:

```bash
docker compose exec mock-nginx-edge wget -qO- http://api:8080/health
```

## Smoke и health

```bash
cd deploy/nginx
docker compose up -d --build
bash scripts/smoke.sh
```

Smoke проверяет `/`, `/static/`, `/api/health`. API имеет **healthcheck** в compose — edge может стартовать раньше api; при 502 на `/api/` смотрите `docker compose ps` и логи api.

## Отличие от deploy/containers

| | deploy/containers | deploy/nginx |
|--|-------------------|--------------|
| Edge | web (nginx + static в одном) | отдельный edge |
| API | Flask | минимальный Python HTTP |
| Порт | 8088 | 8080, 8443 |

Конфиг web: [`stack/web/nginx.conf`](../../deploy/containers/stack/web/nginx.conf) — тот же приём `location /api/ { proxy_pass http://api:8080/; }`.

## Типичные ошибки

| Симптом | Причина |
|---------|---------|
| Изменения conf не видны | забыли reload после -t |
| `host not found` в error.log | неверное имя upstream (не service name) |
| HTTPS не слушает | нет сертификатов, см. `10-tls.conf` |
| Правка не в том файле | другой server{} перехватывает Host |

## В продакшене

- Конфиги — **ConfigMap** + sidecar или ingress-nginx chart.
- Отдельные **access/error** логи на vhost (`access_log` в server).
- `worker_connections` и `worker_processes` под профиль нагрузки.

## Резюме

Стенд курса — **edge + static + api**, одна сеть compose, порты **8080/8443** на хосте. Конфиг слоится: `nginx.conf` → `conf.d/*.conf`. Любая правка: **`nginx -t`**, затем **reload**. Следующая лаба — руками пройти статику и vhost.

## Чек-лист

- Какие три контейнера в стенде?
- Где лежат location для `/api/`?
- Почему upstream — `http://api:8080`, а не localhost?
- Команда проверки синтаксиса?

Следующий урок: [03. Лаба: vhost и статика](03-lab-vhost-static.md).
