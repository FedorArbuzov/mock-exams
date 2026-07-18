# 07. Лаба: намеренный 502 и разбор логов

## Цель лабы

Получить **502** на `/api/health` при живом edge, найти причину в **error.log**, восстановить api и убедиться в **200**. Навык переносится на Ingress и любой API gateway.

## Предварительно

- Теория: [06. Логи и 502](06-logs-502.md).
- Стенд `deploy/nginx` работает.

---

## Задание 1. Базовая линия

```bash
cd deploy/nginx
curl -s -o /dev/null -w "api via edge: %{http_code}\n" http://localhost:8080/api/health
curl -s -o /dev/null -w "edge root: %{http_code}\n" http://localhost:8080/
```

**Что увидите:** оба **200**.

---

## Задание 2. Остановить upstream

```bash
docker compose stop api
curl -s -o /dev/null -w "api via edge: %{http_code}\n" http://localhost:8080/api/health
curl -s -o /dev/null -w "static: %{http_code}\n" http://localhost:8080/static/
```

**Что увидите:** api → **502**; static → **200** (edge жив, сломан только upstream).

---

## Задание 3. error.log

В отдельном терминале:

```bash
tail -f logs/error.log
```

Повторите `curl` на `/api/health`.

**Что увидите:** строка вроде `connect() failed ... Connection refused` и `upstream: "http://api:8080/health"` (точный текст может слегка отличаться).

Скопируйте одну строку в ответ на вопрос: «почему 502?».

---

## Задание 4. access.log

```bash
tail -3 logs/access.log
```

**Что увидите:** запрос к `/api/health` со статусом **502**.

---

## Задание 5. Проверка с edge

```bash
docker compose exec mock-nginx-edge wget -qO- http://api:8080/health
```

**Что увидите:** ошибка соединения (api остановлен) — подтверждает, что чинить нужно **backend**, не reload edge.

---

## Задание 6. Восстановление

```bash
docker compose start api
sleep 3
docker compose ps api
curl -s http://localhost:8080/api/health
```

**Что увидите:** снова `ok`.

---

## Задание 7. Неверный upstream (опционально)

В `00-default.conf` временно замените `http://api:8080/` на `http://api:9999/`, `nginx -t`, reload, curl `/api/health`.

**Что увидите:** снова 502, в error.log — refused на порт 9999.

Верните `8080`, `-t`, reload.

---

## Критерии успеха

- [ ] При остановленном api — 502 только на `/api/`, не на `/static/`
- [ ] В error.log найдена причина connection refused
- [ ] После `compose start api` — 200
- [ ] Можете объяснить коллеге за 30 секунд «edge vs backend»

## Сравнение с linux-intermediate

В [лабе 14](../linux-intermediate/14-lab-nginx.md) 502 получали остановкой nginx на **srv1**. Здесь — остановкой **контейнера api**. Логика error.log та же.

Следующий урок: [08. upstream](08-upstream.md).
