# 11. Финальный проект: edge-маршрутизация под контролем

## Цель

Собрать **согласованную** конфигурацию edge на [`deploy/nginx`](../../deploy/nginx/README.md): маршруты `/`, `/static/`, `/api/`, опционально **HTTPS :8443**, блок **upstream**, расширенный **access log**, runbook на **502**. Сверить поведение с [containers-basic](../containers-basic/README.md) (web nginx) и описать миграцию «compose edge → Ingress».

**Время:** 2–3 часа.

## Предварительно

- Пройдены лабы [03](03-lab-vhost-static.md)–[09](09-lab-upstream.md).
- Теория [10. Ingress](10-ingress-preview.md) прочитана.
- Порты **8080**, **8443** свободны.

---

## Часть A. Базовая линия (30 мин)

1. `cd deploy/nginx && docker compose down -v && docker compose up -d --build`
2. `bash scripts/smoke.sh` — все проверки зелёные.
3. Зафиксируйте в `notes.md` (у себя локально, не в git курса):

   | URL | Ожидание |
   |-----|----------|
   | `http://localhost:8080/` | edge OK |
   | `/static/` | Static backend |
   | `/api/health` | ok |

4. Скрин или вывод `docker compose ps` с **healthy** api.

---

## Часть B. upstream и keepalive (40 мин)

1. Реализуйте [лабу 09](09-lab-upstream.md): `05-upstream-api.conf` + `proxy_pass http://api_backends/`.
2. `docker compose exec mock-nginx-edge nginx -t` и reload.
3. Повторите smoke.

**Критерий:** при `docker compose stop api` — 502 на `/api/`, 200 на `/static/`.

---

## Часть C. TLS (30 мин, опционально но рекомендуется)

```bash
bash scripts/gen-certs.sh
docker compose exec mock-nginx-edge nginx -t
docker compose exec mock-nginx-edge nginx -s reload
curl -sk https://localhost:8443/api/health
curl -skI https://localhost:8443/static/ | head -5
```

В `notes.md`: зачем в `10-tls.conf` нужен `X-Forwarded-Proto https` ([глава 04](04-reverse-proxy.md)).

---

## Часть D. Расширенный access log (30 мин)

Создайте `config/conf.d/99-access-upstream.conf`:

```nginx
log_format upstream_detailed '$remote_addr "$request" status=$status '
    'ups_status=$upstream_status ups_addr=$upstream_addr rt=$request_time';

server {
    listen 80;
    server_name localhost;
    access_log /var/log/nginx/access-upstream.log upstream_detailed;

    location /api/health {
        access_log /var/log/nginx/access-upstream.log upstream_detailed;
        proxy_pass http://api_backends/health;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
    }
}
```

> **Внимание:** отдельный `location /api/health` **конфликтует** с префиксом `/api/` в `00-default.conf` — nginx выберет **более длинное** совпадение. Для проекта либо используйте **только** расширенный `log_format` в существующем `location /api/` через `access_log ... upstream_detailed;`, либо временно комментируйте дублирующий блок после проверки.

Рекомендуемый вариант без дублирования server:

- добавьте `log_format` в `nginx.conf` или `99-...conf`;
- в `00-default.conf` в `location /api/` добавьте вторую строку `access_log /var/log/nginx/access-upstream.log upstream_detailed;`

Сделайте 5 запросов к `/api/health`, покажите строку с `ups_status=200` в `logs/access-upstream.log`.

---

## Часть E. Runbook 502 (20 мин)

Напишите в `notes.md` runbook из **5 шагов** ([глава 06](06-logs-502.md)) и воспроизведите его один раз (stop api → логи → start api).

---

## Часть F. Сравнение с containers-basic (20 мин)

Заполните таблицу:

| Вопрос | deploy/containers (web) | deploy/nginx (edge) |
|--------|-------------------------|---------------------|
| Порт на хосте | 8088 | 8080 |
| Кто проксирует `/api/` | | |
| Где статика | root в web | |
| Имя контейнера edge/web | mock-containers-web | mock-nginx-edge |

Ссылка на конфиг: [`stack/web/nginx.conf`](../../deploy/containers/stack/web/nginx.conf).

---

## Часть G. Мост к Kubernetes (20 мин)

Набросайте **псевдо-Ingress** (YAML в `notes.md`, не обязательно применять):

- host: `lab.local`
- path `/api` → Service `api:8080`
- path `/` → Service `static:80`
- `ingressClassName: nginx`

Сопоставьте каждое поле с директивой из вашего `00-default.conf` ([глава 10](10-ingress-preview.md)).

---

## Сдача (чек-лист)

- [ ] Smoke и `nginx -t` без ошибок
- [ ] upstream + keepalive для `/api/`
- [ ] (Желательно) HTTPS :8443 работает
- [ ] Есть пример строки access log с upstream_status
- [ ] Runbook 502 проверен hands-on
- [ ] Таблица сравнения с containers-basic
- [ ] Псевдо-Ingress сопоставлен с nginx

## Куда дальше

| Курс | Тема |
|------|------|
| [nginx-intermediate](../nginx-intermediate/README.md) | rate limit (`/login`), hardening TLS |
| [kuber-basic/20–21](../kuber-basic/20-ingress.md) | Ingress в кластере |
| [linux-intermediate/14](../linux-intermediate/14-lab-nginx.md) | proxy на VM srv1/lab |

## Очистка

```bash
cd deploy/nginx
docker compose down -v
```

Удалите экспериментальные `conf.d/99-*.conf` или верните `00-default.conf` к состоянию репозитория перед коммитом в свой fork.
