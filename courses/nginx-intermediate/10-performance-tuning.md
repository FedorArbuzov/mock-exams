# 10. Тюнинг производительности nginx

## Введение: «nginx не держит нагрузку»

Чаще узкое место не в «слабом nginx», а в **мало workers**, **низкий `worker_connections`**, короткий **keepalive**, блокирующий backend или диск для логов. Эта глава — базовые ручки на стенде [`deploy/nginx/config/nginx.conf`](../../deploy/nginx/config/nginx.conf) без ухода в kernel tuning (`somaxconn`, `epoll` — тема linux-advanced).

Связь с [nginx-basic](../nginx-basic/README.md): master/worker модель уже знакома; здесь — **числа**.

## Что вы узнаете

- `worker_processes` и `worker_connections`.
- Оценка «сколько одновременных клиентов».
- `keepalive_timeout` и keepalive к upstream.
- `sendfile`, `tcp_nopush`, access log.

---

## Модель процессов

```nginx
user  nginx;
worker_processes auto;
```

| Директива | Рекомендация |
|-----------|----------------|
| `worker_processes auto` | по числу CPU на bare metal / VM |
| в контейнере | часто `1`–`2` из-за лимита CPU cgroup — `auto` ок |

Каждый worker — отдельный процесс, не поток. Падение одного worker master перезапустит.

---

## worker_connections

```nginx
events {
    worker_connections 1024;
}
```

Грубая верхняя оценка одновременных **клиентских** соединений:

```text
max_clients ≈ worker_processes × worker_connections
```

На практике меньше: одно соединение браузера + **upstream** connection + internal redireсты. Для reverse proxy иногда учитывают **×2**.

Пример: `auto` → 4 workers, `1024` → теоретически ~4096 клиентских сокетов. В Docker lab с `worker_processes 1` и `1024` — достаточно для `ab` и учебных тестов.

Увеличение без нужды:

- больше RAM на соединение;
- упираетесь в `ulimit -n` — см. `worker_rlimit_nofile` в prod.

```nginx
events {
    worker_connections 4096;
}
# worker_rlimit_nofile 8192;  # в main context, prod
```

---

## keepalive_timeout (клиент ↔ nginx)

В стенде:

```nginx
keepalive_timeout 65;
```

| Эффект | Значение |
|--------|----------|
| Выше (75–120s) | меньше новых TCP/TLS handshakes для «бродящих» клиентов |
| Ниже (5–15s) | быстрее освобождаются слоты worker_connections |

Для API с короткими запросами иногда снижают. Для SPA с постоянными запросами — оставляют выше.

**keepalive_requests** — сколько запросов на одном keep-alive соединении до закрытия (по умолчанию 1000).

---

## keepalive к upstream (nginx ↔ backend)

Без keepalive nginx на **каждый** запрос клиента открывает новое TCP к backend:

```nginx
upstream api_backend {
    server api:8080;
    keepalive 32;
}

location /api/ {
    proxy_pass http://api_backend;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    ...
}
```

| Директива | Зачем |
|-----------|--------|
| `keepalive 32` в upstream | пул соединений к backend |
| `proxy_http_version 1.1` | нужен для keepalive к upstream |
| `Connection ""` | сброс hop-by-hop Connection |

На учебном стенде с малым трафиком выгода мала; в проде с тысячами RPS — существенна.

---

## sendfile и tcp

```nginx
sendfile on;
tcp_nopush on;
tcp_nodelay on;
```

`sendfile` — отдача статики без лишнего копирования в userspace (если nginx отдаёт файлы с диска). Для `proxy_pass` менее критично.

---

## Логирование под нагрузкой

`access_log` на каждый запрос — диск I/O. Высоконагруженные edge:

- буфер: `access_log /var/log/nginx/access.log main buffer=32k flush=5s`;
- sampling или отключение healthcheck paths через `map` + `access_log off`;
- отдельный формат без тяжёлых полей.

На стенде оставьте логи включёнными для обучения.

---

## TLS performance (кратко)

- TLS 1.3 меньше round-trips.
- Session tickets / cache — быстрее повторные handshakes.
- Терминация на CPU-bound — тогда 2+ workers и аппаратное ускорение (в cloud — на LB).

Подробности cipher — mozilla ssl-config-generator; в lab достаточно `TLSv1.2 TLSv1.3` из `10-tls.conf`.

---

## Контейнер vs bare metal

| Фактор | Контейнер edge |
|--------|----------------|
| CPU limit | меньше workers эффективно |
| Сеть | bridge, не 10 Gbps NIC |
| Диск cache | volume медленнее tmpfs |

Тюнинг «как в проде» делают на VM/bare metal или на managed LB; в курсе вы понимаете **смысл** параметров и проверяете `nginx -T` (полный дамп конфига).

---

## Проверка на стенде

```bash
docker compose exec edge nginx -T | grep -E 'worker_processes|worker_connections|keepalive'
ab -n 2000 -c 50 http://localhost:8080/api/health
docker compose exec edge sh -c 'ps aux | grep nginx'
```

Сравните load до/после уменьшения `worker_connections` до 256 при `ab -c 100` — при нехватке слотов в error.log появятся `worker_connections are not enough`.

---

## Связь с Ingress

Ingress Controller — те же workers, плюс **горизонтальное масштабирование** реплик Pod. HPA по CPU/latency в [kuber-intermediate](../kuber-intermediate/README.md) дополняет вертикальный тюнинг одного nginx.

---

## Резюме

Производительность edge nginx: достаточно workers, `worker_connections` с запасом, разумный keepalive, keepalive к upstream, аккуратные логи. На стенде меняйте параметры осознанно и смотрите `error.log`.

## Чек-лист

- [ ] Формула max_clients?
- [ ] Зачем keepalive в `upstream`?
- [ ] Почему WS требует большого `proxy_read_timeout`?

Следующий урок: [11. Финальный проект](11-final-project.md).
