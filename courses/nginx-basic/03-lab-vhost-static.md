# 03. Лаба: vhost и статика через edge

## Цель лабы

Поднять стенд `deploy/nginx`, проверить **маршрутизацию по path**, убедиться что **статика** идёт через edge на backend **static**, и отработать цикл **правка conf → nginx -t → reload**.

## Предварительно

- Порты **8080** и **8443** свободны.
- Теория: [01](01-why-nginx.md), [02](02-architecture.md).
- Docker Compose v2 (`docker compose`).

---

## Задание 1. Старт стенда

```bash
cd deploy/nginx
docker compose up -d --build
docker compose ps
```

**Что увидите:** `mock-nginx-api`, `mock-nginx-static`, `mock-nginx-edge` — State **running**; у api через время **healthy**.

---

## Задание 2. Edge health и server_name

```bash
curl -s http://localhost:8080/
curl -s http://localhost:8080/ -H 'Host: lab.local'
```

**Что увидите:** тело `nginx lab edge OK` — `location /` в `00-default.conf`.

---

## Задание 3. Статика через proxy

```bash
curl -s http://localhost:8080/static/ | head -5
bash scripts/smoke.sh
```

**Что увидите:** HTML `<h1>Static backend</h1>`; smoke — `OK: nginx smoke passed`.

**Зачем:** запрос не читает файлы с диска edge — edge **проксирует** на `static:80`.

---

## Задание 4. Прямой доступ к static (из сети compose)

```bash
docker compose exec mock-nginx-edge wget -qO- http://static/
```

**Что увидите:** тот же HTML без префикса `/static/` на backend (у static корень `/usr/share/nginx/html`).

---

## Задание 5. Изменить статическую страницу

Отредактируйте [`backends/static/html/index.html`](../../deploy/nginx/backends/static/html/index.html) — добавьте строку, например `<p>Lab 03</p>`.

```bash
curl -s http://localhost:8080/static/ | grep Lab
```

**Что увидите:** новый текст **без** пересборки edge (volume только у static).

---

## Задание 6. Проверка и reload edge

Симулируйте «безопасный деплой конфига»:

```bash
docker compose exec mock-nginx-edge nginx -t
docker compose exec mock-nginx-edge nginx -s reload
```

Добавьте в `config/conf.d/00-default.conf` в `location /` заголовок:

```nginx
add_header X-Lab nginx-basic-03;
```

Повторите `-t` и `reload`, затем:

```bash
curl -sI http://localhost:8080/ | grep -i X-Lab
```

**Что увидите:** `X-Lab: nginx-basic-03`.

**Если `nginx -t` fail:** исправьте синтаксис; **не** делайте reload до ok.

---

## Задание 7. Сравнение с containers-basic

Откройте [`deploy/containers/stack/web/nginx.conf`](../../deploy/containers/stack/web/nginx.conf).

**Вопросы (запишите ответы):**

1. Где там раздаётся статика — `root` или `proxy_pass`?
2. Куда уходит `/api/`?

---

## Критерии успеха

- [ ] `curl localhost:8080/` → edge OK
- [ ] `curl localhost:8080/static/` → Static backend
- [ ] `nginx -t` в `mock-nginx-edge` без ошибок
- [ ] После reload виден заголовок `X-Lab`
- [ ] Понимаете, почему static — отдельный контейнер

## Если что-то пошло не так

| Симптом | Действие |
|---------|----------|
| Connection refused :8080 | `docker compose ps`, edge running? |
| 404 на `/static/` | сравните `location /static/` и `proxy_pass` со [`00-default.conf`](../../deploy/nginx/config/conf.d/00-default.conf) |
| 502 на `/static/` | `docker compose logs static` |

Следующий урок: [04. Reverse proxy](04-reverse-proxy.md).
