# 05. Лаба: proxy_pass и ловушка слэша

## Цель лабы

Проверить рабочий **proxy_pass** на стенде, **намеренно** сломать URI без слэша, увидеть **404** на backend, восстановить конфиг и сравнить с [containers-basic web](../../deploy/containers/stack/web/nginx.conf).

## Предварительно

- Стенд поднят ([лаба 03](03-lab-vhost-static.md)).
- Теория: [04. Reverse proxy](04-reverse-proxy.md).

---

## Задание 1. Базовая проверка API

```bash
cd deploy/nginx
curl -s http://localhost:8080/api/health
curl -s http://localhost:8080/api/hits
```

**Что увидите:** `ok` и JSON `{"hits": 1}`.

---

## Задание 2. Запрос с edge внутрь сети

```bash
docker compose exec mock-nginx-edge wget -qO- http://api:8080/health
```

**Что увидите:** `ok` — backend жив без префикса `/api`.

---

## Задание 3. Сломать proxy_pass (убрать слэш)

В `config/conf.d/00-default.conf` в блоке `location /api/` временно замените:

```nginx
proxy_pass http://api:8080/;
```

на:

```nginx
proxy_pass http://api:8080;
```

```bash
docker compose exec mock-nginx-edge nginx -t
docker compose exec mock-nginx-edge nginx -s reload
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/api/health
```

**Что увидите:** скорее **404** (api не знает путь `/api/health`).

Посмотрите access.log:

```bash
tail -3 logs/access.log
```

---

## Задание 4. Восстановить правильный слэш

Верните `proxy_pass http://api:8080/;`, `-t`, `reload`, снова:

```bash
curl -s http://localhost:8080/api/health
```

**Что увидите:** `ok`.

Запишите в тетрадь строку таблицы: «`/api/health` + слэш в proxy_pass → `/health` на api».

---

## Задание 5. Заголовки (опционально)

Временно добавьте в `location /api/`:

```nginx
add_header X-Debug-Uri $request_uri always;
```

После reload:

```bash
curl -sI http://localhost:8080/api/health | grep -i X-Debug
```

**Что увидите:** `X-Debug-Uri: /api/health` — клиентский URI; backend всё равно получил `/health`.

Удалите `add_header` и снова reload.

---

## Задание 6. Сравнение с deploy/containers

```bash
grep -A5 'location /api/' ../../deploy/containers/stack/web/nginx.conf
```

**Вопрос:** есть ли там слэш после `8080`? Совпадает ли поведение с edge?

---

## Задание 7. HTTPS (если есть certs)

```bash
test -f certs/server.crt && curl -sk https://localhost:8443/api/health || echo "skip: run scripts/gen-certs.sh"
```

---

## Критерии успеха

- [ ] Понимаете разницу 200 vs 404 при слэше
- [ ] После каждой правки был успешный `nginx -t`
- [ ] Конфиг возвращён к рабочему виду
- [ ] Сравнили с web nginx в containers-basic

## Если что-то пошло не так

| Симптом | Действие |
|---------|----------|
| 502 вместо 404 | `docker compose logs api`, healthcheck |
| reload не помогает | убедитесь, что правили файл в `config/conf.d/` на хосте |
| nginx -t ошибка | проверьте `;` и закрывающие `}` |

Следующий урок: [06. Логи и 502](06-logs-502.md).
