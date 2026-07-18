# 06. Лаба: rate limit на /login

## Цель

Увидеть работу `limit_req` на **http://localhost:8080/login**: при всплеске запросов — ответы **429 Too Many Requests**, разобрать конфиг зоны и location.

## Предварительно

- Стенд запущен, [05-rate-limiting](05-rate-limiting.md) прочитана
- Установлен `ab` (ApacheBench) или используйте цикл `curl`

---

## Задание 1. Изучить конфиг

```bash
grep -n limit deploy/nginx/config/nginx.conf
grep -n -A5 '/login' deploy/nginx/config/conf.d/00-default.conf
```

Сопоставьте с [examples/rate-limit.conf](examples/rate-limit.conf):

- зона: `lab_limit`, `rate=10r/s`, память `10m`;
- location: `burst=5 nodelay`, `proxy_pass` на `/slow`.

---

## Задание 2. Одиночный запрос

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/login
curl -s http://localhost:8080/login
```

**Ожидание:** `200`, тело `slow ok`.

---

## Задание 3. Всплеск (ApacheBench)

```bash
ab -n 50 -c 10 http://localhost:8080/login
```

В summary найдите:

- **Non-2xx responses** (должны быть 429);
- **Complete requests** = 50.

Пример интерпретации: часть запросов 200, часть 429 — лимит сработал.

Если `ab` нет (Windows):

```powershell
1..30 | ForEach-Object -Parallel {
  try { (Invoke-WebRequest -Uri http://localhost:8080/login -UseBasicParsing).StatusCode } catch { $_.Exception.Response.StatusCode.value__ }
} -ThrottleLimit 15
```

Или bash:

```bash
for i in $(seq 1 30); do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/login &
done
wait
```

---

## Задание 4. Логи

```bash
docker compose exec edge tail -20 /var/log/nginx/access.log
```

Найдите строки со статусом **429** и URI `/login`.

---

## Задание 5. Изменить rate (эксперимент)

В `config/nginx.conf` временно поставьте `rate=2r/s`, reload, повторите `ab -n 20 -c 5`.

**Ожидание:** больше 429. Верните `10r/s` после эксперимента.

```bash
docker compose exec edge nginx -t
docker compose exec edge nginx -s reload
```

---

## Задание 6. Контроль: /api/health без лимита

```bash
ab -n 100 -c 20 http://localhost:8080/api/health
```

**Ожидание:** почти все **200** (лимит не на этом location).

---

## Критерии сдачи

- [ ] Объясняете назначение `limit_req_zone` и `limit_req`
- [ ] При `ab -n 50 -c 10` на `/login` есть 429
- [ ] `/api/health` под той же нагрузкой не режется
- [ ] В access.log видны 429

---

## Troubleshooting

| Симптом | Действие |
|---------|----------|
| Все 200 при ab | слишком высокий rate; увеличьте `-n` и `-c` |
| Все 502 | api не запущен |
| 404 | URI без trailing slash — используйте `/login` как в конфиге |

---

## Что дальше

[07. Кэш и gzip](07-caching-gzip.md) — сжатие и кэш ответов на edge.
