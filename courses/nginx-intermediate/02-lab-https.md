# 02. Лаба: HTTPS на стенде deploy/nginx

## Цель

Включить TLS на edge, убедиться что API и static доступны по **https://localhost:8443**, и прочитать сертификат через **openssl** / **curl -v**. Закрепить материал [09-tls-openssl](../linux-intermediate/09-tls-openssl.md) и [01-tls-termination](01-tls-termination.md).

## Предварительно

- Стенд запущен: `cd deploy/nginx && docker compose up -d --build`
- `bash scripts/smoke.sh` — HTTP 200 на :8080
- Прочитаны главы 01 и [linux-intermediate/09-tls-openssl](../linux-intermediate/09-tls-openssl.md)

---

## Задание 1. Генерация сертификатов

**Зачем:** без `server.crt` nginx не поднимет `listen 443 ssl`.

```bash
cd deploy/nginx
bash scripts/gen-certs.sh
ls -la certs/
```

**Ожидание:** `server.crt`, `server.key`; в выводе скрипта — `OK: certs/server.crt`.

Проверка SAN:

```bash
openssl x509 -in certs/server.crt -noout -ext subjectAltName
```

Должны быть `localhost`, `lab.local`, `127.0.0.1`.

---

## Задание 2. Проверка конфигурации TLS

Откройте `config/conf.d/10-tls.conf` и сравните с [examples/ssl-server-block.conf](examples/ssl-server-block.conf).

```bash
docker compose exec edge nginx -t
docker compose exec edge nginx -s reload
```

**Ожидание:** `syntax is ok`, `test is successful`.

Если ошибка про certificate — путь `/etc/nginx/certs/` в контейнере должен совпадать с volume в `docker-compose.yml`.

---

## Задание 3. Запросы по HTTPS

```bash
curl -sk https://localhost:8443/
curl -sk https://localhost:8443/api/health
curl -sk https://localhost:8443/static/ | head -5
```

| URL | Ожидаемый ответ |
|-----|-----------------|
| `/` | `nginx lab TLS OK` |
| `/api/health` | `ok` |
| `/static/` | HTML index |

Сравните с HTTP:

```bash
curl -s http://localhost:8080/api/health
```

Оба должны отдавать `ok`.

---

## Задание 4. Разбор handshake

```bash
curl -vk https://localhost:8443/ 2>&1 | head -40
```

Найдите в выводе:

- версию TLS (1.2 или 1.3);
- subject/issuer cert;
- предупреждение `SSL certificate problem` (self-signed) — это нормально без `-k` на строгой проверке.

```bash
echo | openssl s_client -connect localhost:8443 -servername localhost 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates
```

**issuer** ≈ **subject** — признак self-signed.

---

## Задание 5. X-Forwarded-Proto (опционально)

В `10-tls.conf` для `/api/` уже стоит `X-Forwarded-Proto https`. Убедитесь, что в `00-default.conf` на HTTP — `$scheme`.

**Мысленный эксперимент:** если backend вернёт redirect на `http://` при запросе через HTTPS — какой заголовок вы проверите в логах api?

---

## Задание 6. Намеренная ошибка (2 мин)

Переименуйте cert и проверьте `nginx -t`:

```bash
mv certs/server.crt certs/server.crt.bak
docker compose exec edge nginx -t
mv certs/server.crt.bak certs/server.crt
```

**Ожидание:** `cannot load certificate` — запомните текст для runbook.

---

## Критерии сдачи

- [ ] `gen-certs.sh` выполнен, файлы в `certs/`
- [ ] `nginx -t` OK, reload без ошибок
- [ ] `curl -sk https://localhost:8443/api/health` → `ok`
- [ ] `openssl x509` показывает SAN с localhost
- [ ] Объясняете одной фразой, зачем `-k` в лабе и почему в prod его не используют

---

## Troubleshooting

| Симптом | Действие |
|---------|----------|
| Connection refused :8443 | `docker compose ps`, порт 8443 в compose |
| SSL error | cert не сгенерирован или не смонтирован |
| 502 на `/api/` | `docker compose logs api`, healthcheck |

См. [deploy/nginx/README.md](../../deploy/nginx/README.md).

---

## Что дальше

[03. Security headers](03-security-headers.md) — HSTS и защита браузера на том же TLS `server`.
