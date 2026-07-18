# 14. Лаба: reverse proxy lab → srv1

## Цель лабы

Собрать схему как в проде: **клиент** (вы на lab) → **reverse proxy** (nginx на lab:8080) → **backend** (nginx на srv1:80). Вы увидите **200**, потом намеренно **502**, и прочитаете **error.log** — навык, который переносится на Ingress и любой API gateway.

## Предварительно

- [13. nginx](13-nginx.md) прочитан.
- srv1 отвечает: `curl http://172.28.0.11/` → 200 (если нет — установите nginx на srv1).
- lab с sudo.

```bash
docker compose exec lab bash
sudo apt install -y nginx curl
curl -s -o /dev/null -w "srv1=%{http_code}\n" http://172.28.0.11/
```

---

## Подготовка стенда

```bash
sudo systemctl enable --now nginx
ss -tlnp | grep nginx
```

---

## Задание 1. Проверка backend напрямую

**Зачем:** отделить «backend сломан» от «proxy сломан».

```bash
curl -s http://172.28.0.11/ | head -5
curl -s -o /dev/null -w "direct srv1: %{http_code}\n" http://172.28.0.11/
```

Запишите: **direct = 200** (ожидается).

---

## Задание 2. Конфиг proxy на lab

**Зачем:** единая точка входа :8080.

```bash
sudo tee /etc/nginx/sites-available/srv1-proxy <<'EOF'
server {
    listen 8080;
    listen [::]:8080;
    server_name _;

    access_log /var/log/nginx/proxy-access.log;
    error_log  /var/log/nginx/proxy-error.log warn;

    location / {
        proxy_pass http://172.28.0.11;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_read_timeout 30s;
    }
}
EOF
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/srv1-proxy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
ss -tlnp | grep 8080
```

**Что увидите:** `syntax is ok`, LISTEN на **8080**.

**Если nginx -t fail:** проверьте путь к log, скобки в server {}.

---

## Задание 3. Успешный запрос через proxy

```bash
curl -s http://127.0.0.1:8080/ | head -8
curl -s -o /dev/null -w "via proxy: %{http_code}\n" http://127.0.0.1:8080/
curl -v http://127.0.0.1:8080/ 2>&1 | grep -E "Connected|HTTP/"
```

**Что увидите:** тот же HTML, что с srv1 напрямую; **HTTP/1.1 200**.

```bash
sudo tail -2 /var/log/nginx/proxy-access.log
```

---

## Задание 4. Сценарий 502 — backend выключен

**Зачем:** научиться читать error.log.

На srv1 (в другой сессии):

```bash
ssh course@172.28.0.11 'sudo systemctl stop nginx'
```

На lab:

```bash
curl -s -o /dev/null -w "via proxy: %{http_code}\n" http://127.0.0.1:8080/
sudo tail -5 /var/log/nginx/proxy-error.log
```

**Что увидите:** код **502** и строка вроде `connect() failed (111: Connection refused)`.

Восстановите backend:

```bash
ssh course@172.28.0.11 'sudo systemctl start nginx'
curl -s -o /dev/null -w "via proxy: %{http_code}\n" http://127.0.0.1:8080/
```

---

## Задание 5. Host header (опционально)

```bash
curl -s http://127.0.0.1:8080/ -H 'Host: test.lab.local' -o /dev/null -w "%{http_code}\n"
```

Backend srv1 с default server обычно всё равно отдаёт страницу — для API иногда важен точный Host.

---

## Уборка (опционально)

```bash
sudo rm -f /etc/nginx/sites-enabled/srv1-proxy
sudo ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/ 2>/dev/null || true
sudo systemctl reload nginx
```

Конфиг proxy оставьте, если делаете [финальный проект](34-final-project.md).

---

## Критерии успеха

- [ ] direct srv1 → 200
- [ ] via :8080 → 200 при живом backend
- [ ] при stop nginx на srv1 → 502 + запись в proxy-error.log
- [ ] backend восстановлен → снова 200

## Что унести в работу

- 502 — всегда backend/upstream, не «интернет».
- Проверяйте: curl backend с **той же машины**, где nginx proxy.

Следующий урок: [15. Apache](15-apache.md).
