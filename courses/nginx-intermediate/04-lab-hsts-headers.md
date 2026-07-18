# 04. Лаба: HSTS и security headers на edge

## Цель

Добавить на HTTPS `server` стенда набор security headers, проверить их через `curl -I` и убедиться, что `nginx -t` / `reload` проходят без ошибок.

## Предварительно

- [02-lab-https](02-lab-https.md) выполнена: TLS работает на :8443
- [03-security-headers](03-security-headers.md) прочитана

---

## Задание 1. Резервная копия конфига

```bash
cd deploy/nginx
cp config/conf.d/10-tls.conf config/conf.d/10-tls.conf.bak
```

---

## Задание 2. Добавить headers в 10-tls.conf

Внутри `server { listen 443 ssl; ... }` **после** директив `ssl_*` и **до** `location`, добавьте:

```nginx
    add_header Strict-Transport-Security "max-age=86400" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

Используйте **86400** (1 день) для лабы, не год.

```bash
docker compose exec edge nginx -t
docker compose exec edge nginx -s reload
```

---

## Задание 3. Проверка заголовков

```bash
curl -skI https://localhost:8443/ | grep -iE 'strict-transport|x-frame|x-content|referrer'
curl -skI https://localhost:8443/static/ | grep -i strict-transport
curl -skI https://localhost:8443/api/health | grep -i x-content
```

**Ожидание:** все четыре заголовка присутствуют на корне и на `/static/`, `/api/health`.

Запишите значение `Strict-Transport-Security` целиком.

---

## Задание 4. Поведение без always (демо)

Временно уберите `always` у одного заголовка и верните искусственную 502 (остановите api: `docker compose stop api`), затем:

```bash
curl -skI https://localhost:8443/api/health
docker compose start api
```

Обсудите: появился ли `X-Content-Type-Options` на ответе 502? Верните `always` и повторите — headers должны остаться.

---

## Задание 5. HTTP не должен слать HSTS (контроль)

```bash
curl -sI http://localhost:8080/ | grep -i strict-transport
```

**Ожидание:** пусто (HSTS только на HTTPS server).

---

## Критерии сдачи

- [ ] Четыре заголовка на `https://localhost:8443/`
- [ ] `max-age=86400` в HSTS
- [ ] На HTTP :8080 нет `Strict-Transport-Security`
- [ ] Объясняете, зачем `always`

---

## Откат

```bash
mv config/conf.d/10-tls.conf.bak config/conf.d/10-tls.conf
docker compose exec edge nginx -s reload
```

---

## Что дальше

[05. Rate limiting](05-rate-limiting.md) — защита `/login` и зона `lab_limit`.
