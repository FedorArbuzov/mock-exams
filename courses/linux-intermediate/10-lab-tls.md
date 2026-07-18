# 10. Лаба: self-signed HTTPS на web

## Цель лабы

Выпустить пару key+cert, настроить **nginx** на **443**, разобрать **curl -v** и **openssl s_client** — чтобы в проде читать ошибки TLS так же спокойно, как «connection refused».

## Предварительно

- [09. TLS](09-tls-openssl.md).
- Контейнер **web** (172.28.0.20) Up.

```bash
ssh course@172.28.0.20
# или: docker compose exec web bash
sudo apt update
sudo apt install -y nginx openssl
```

---

## Подготовка стенда

```bash
systemctl is-active nginx 2>/dev/null || true
ss -tlnp | grep -E ':80|:443' || true
```

---

## Задание 1. Выпуск сертификата

**Зачем:** без ключа nginx не поднимет ssl.

```bash
sudo mkdir -p /etc/ssl/lab
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/lab/key.pem \
  -out /etc/ssl/lab/cert.pem \
  -subj "/CN=web.lab.local"
sudo chmod 600 /etc/ssl/lab/key.pem
openssl x509 -in /etc/ssl/lab/cert.pem -noout -subject -dates
openssl rsa -in /etc/ssl/lab/key.pem -check -noout
```

**Что увидите:** `subject=CN = web.lab.local`, `notAfter` через ~365 дней, `RSA key ok`.

**Если key check fail:** пересоздайте пару, не смешивайте старый key с новым cert.

---

## Задание 2. Конфиг nginx

```bash
sudo tee /etc/nginx/sites-available/lab-ssl <<'EOF'
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name web.lab.local _;

    ssl_certificate     /etc/ssl/lab/cert.pem;
    ssl_certificate_key /etc/ssl/lab/key.pem;

    location / {
        return 200 "tls-ok\n";
        add_header Content-Type text/plain;
    }
}
EOF
sudo ln -sf /etc/nginx/sites-available/lab-ssl /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx
ss -tlnp | grep 443
```

**Если `nginx -t` fail:** пути к pem, синтаксис `ssl_certificate`; `journalctl -u nginx -n 20`.

---

## Задание 3. curl локально на web

```bash
curl -k -s https://127.0.0.1/
curl -v https://127.0.0.1/ 2>&1 | grep -E "SSL certificate|subject:|issuer:|verify"
```

**Что увидите:** тело `tls-ok`; без `-k` — ошибка verify (self-signed).

---

## Задание 4. openssl s_client

```bash
echo | openssl s_client -connect 127.0.0.1:443 -servername web.lab.local 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates
```

**Зачем:** то же, что делает curl на этапе проверки cert.

---

## Задание 5. С lab по сети

На **lab**:

```bash
curl -k -s https://172.28.0.20/
curl -v https://172.28.0.20/ 2>&1 | head -25
openssl s_client -connect 172.28.0.20:443 -servername web.lab.local </dev/null 2>/dev/null \
  | openssl x509 -noout -subject
```

| Проблема | Проверка |
|----------|----------|
| timeout | `ping 172.28.0.20`, ufw (позже), `ss -tlnp \| grep 443` на web |
| connection refused | nginx не слушает 443 |

---

## Задание 6. Ошибка без -k (учебно)

```bash
curl -s https://172.28.0.20/ 2>&1 | head -5
```

**Ожидается:** `SSL certificate problem: self signed certificate` (или похожее) — это **норма** для lab.

---

## Задание 7. Неверная пара key/cert (опционально)

**Только если готовы откатить:**

```bash
sudo mv /etc/ssl/lab/key.pem /etc/ssl/lab/key.pem.bak
sudo openssl req -x509 -nodes -days 30 -newkey rsa:2048 \
  -keyout /etc/ssl/lab/key.pem -out /etc/ssl/lab/cert2.pem -subj "/CN=other"
# намеренно укажите старый cert в nginx и выполните nginx -t
sudo nginx -t
sudo mv /etc/ssl/lab/key.pem.bak /etc/ssl/lab/key.pem
sudo nginx -t
```

**Зачем:** увидеть ошибку несовпадения key/cert до prod.

---

## Уборка (опционально)

```bash
sudo rm -f /etc/nginx/sites-enabled/lab-ssl
sudo ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/ 2>/dev/null || true
sudo systemctl reload nginx
```

---

## Критерии успеха

- [ ] `nginx -t` OK, listen 443
- [ ] `curl -k` с lab → tls-ok
- [ ] `openssl x509` показывает CN web.lab.local
- [ ] Понимаете, зачем `-k` только в lab

## Что унести в работу

- «TLS сломан» → `openssl s_client`, `nginx -t`, права 600 на key.
- Expiry — в мониторинг за 30 дней.
- Hostname mismatch — сверять URL и SAN.

Следующий урок: [11. Диагностика сети](11-network-debug.md).
