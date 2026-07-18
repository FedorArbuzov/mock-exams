# 13. nginx: vhost, reverse proxy

> Углублённый курс на Docker-стенде: [nginx-basic](../nginx-basic/README.md) → [intermediate](../nginx-intermediate/README.md) ([`deploy/nginx`](../../deploy/nginx/README.md)). Здесь — nginx на **VM** (`deploy/linux`).

## Введение: один IP — много сайтов

Пользователь открывает `https://shop.example.com` и `https://api.example.com`. IP сервера **один**. **nginx** смотрит заголовок **Host** (или SNI для HTTPS) и выбирает: отдать файлы из `/var/www/shop`, проксировать на backend :8080, или вернуть 404.

Без reverse proxy вам пришлось бы выставлять в интернет десяток портов. С nginx — **80/443 снаружи**, маршрутизация внутри. В Kubernetes ту же роль играет **Ingress** — часто это nginx или traefik под капотом.

Эта глава — как читать конфиг, не бояться **reload** и не попасть в ловушку **слэша** в `proxy_pass`.

## Что вы узнаете

- Роли процессов **master** и **worker**.
- Структуру `/etc/nginx` на Ubuntu/Debian.
- Собрать **статический** site и **reverse proxy**.
- Заголовки **X-Forwarded-*** — зачем backend их ждёт.
- Разбор **502** по error.log.
- Таблицу «URL клиента → URI на backend» для `proxy_pass`.

## Процессы: master и workers

```bash
ps aux | grep nginx
```

Обычно:

- **master** (root) — читает конфиг, открывает порты 80/443.
- **worker** (www-data) — обрабатывают соединения.

Почему это важно: файлы в `DocumentRoot` должны быть **читаемы** для user **www-data**, даже если вы правили конфиг от root.

```bash
sudo systemctl status nginx
sudo nginx -t
sudo systemctl reload nginx
```

| Действие | Команда | Когда |
|----------|---------|--------|
| Проверить синтаксис | `nginx -t` | **всегда** перед reload |
| Подхватить конфиг | `systemctl reload nginx` | после успешного -t |
| Полный перезапуск | `systemctl restart nginx` | редко, обрывает соединения |

## Файлы конфигурации

```text
/etc/nginx/
├── nginx.conf              # главный файл, include sites-enabled
├── sites-available/        # все vhost
├── sites-enabled/          # symlink → активные
├── snippets/               # общие фрагменты
└── ...
/var/log/nginx/
├── access.log
└── error.log
```

На Debian **не правьте** `nginx.conf` без нужды — добавляйте site в `sites-available/`.

## Статический сайт — пошагово

Содержимое `sites-available/app`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name app.lab.local;

    root /var/www/app;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ =404;
    }

    access_log /var/log/nginx/app-access.log;
    error_log  /var/log/nginx/app-error.log;
}
```

Разбор:

| Директива | Смысл |
|-----------|--------|
| `listen 80` | принимать HTTP на всех IPv4 |
| `server_name` | какой Host обслуживать |
| `root` | каталог файлов на диске |
| `try_files` | файл → каталог/ → иначе 404 |

Команды:

```bash
sudo mkdir -p /var/www/app
echo '<h1>Static app</h1>' | sudo tee /var/www/app/index.html
sudo nano /etc/nginx/sites-available/app
sudo ln -sf /etc/nginx/sites-available/app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
curl -s http://127.0.0.1/ -H 'Host: app.lab.local'
```

## Reverse proxy — схема

```mermaid
flowchart LR
  Browser[Browser]
  Nginx[nginx :80]
  Backend[app :8080]
  Browser -->|GET /api/users| Nginx
  Nginx -->|GET /users| Backend
```

Конфиг:

```nginx
server {
    listen 80;
    server_name api.lab.local;

    location /api/ {
        proxy_pass http://127.0.0.1:8080/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Заголовки — зачем backend их читает

| Заголовок | Зачем |
|-----------|--------|
| `Host` | виртуальный хост на backend |
| `X-Real-IP` | IP клиента (для логов, rate limit) |
| `X-Forwarded-For` | цепочка прокси |
| `X-Forwarded-Proto` | http или https (если TLS на nginx) |

Без `X-Forwarded-Proto` приложение может строить **http**-ссылки за HTTPS-терминацией.

### Слэш в proxy_pass — самая частая ошибка

nginx сопоставляет `location /api/` с URI запроса.

| Запрос клиента | proxy_pass | Что уходит на backend |
|----------------|------------|------------------------|
| `GET /api/users` | `http://127.0.0.1:8080/` | `GET /users` |
| `GET /api/users` | `http://127.0.0.1:8080` | `GET /api/users` |
| `GET /api/users` | `http://127.0.0.1:8080/v1/` | `GET /v1/users` |

**Правило:** слэш **после** IP в `proxy_pass` **отрезает** префикс location (если location тоже с `/api/`).

Проверка мысленно перед деплоем: «какой path увидит мой Node/Go/Python app?»

## 502 Bad Gateway — nginx жив, backend нет

Клиент видит 502. nginx **принял** запрос, но **не получил** нормальный ответ от upstream.

```bash
tail -30 /var/log/nginx/error.log
```

Типичные строки:

```text
connect() failed (111: Connection refused) while connecting to upstream
upstream timed out (110: Connection timed out)
```

Диагностика **с сервера nginx**:

```bash
curl -v http://127.0.0.1:8080/health
ss -tlnp | grep 8080
systemctl status myapp
```

В [лабе 14](14-lab-nginx.md) вы **намеренно** остановите nginx на srv1 и увидите 502 на lab.

## default_server и server_name

Если Host не совпал ни с одним `server_name`, сработает **default_server** (первый listen с флагом `default_server`). Симптом: «открываю IP — вижу чужой сайт». Лечение: явный default или правильный Host в curl.

## На стенде deploy/linux

| Хост | Роль |
|------|------|
| srv1 172.28.0.11 | backend :80 (nginx/apache) |
| lab 172.28.0.10 | proxy :8080 → srv1 |

Пример: [`linux-basic/examples/nginx/lab-proxy.conf`](../linux-basic/examples/nginx/lab-proxy.conf)

## Типичные ошибки

| Симптом | Причина | Действие |
|---------|---------|----------|
| 404 на API | слэш proxy_pass | таблица выше |
| 502 | backend down | curl upstream, error.log |
| 403 static | права www-data | `namei -l`, chmod/chown |
| 413 body | client_max_body_size | увеличить в nginx |
| reload fail | не делали nginx -t | исправить синтаксис |

## В продакшене

- Конфиг в Git, деплой через Ansible/CI.
- **Canary**: два upstream, weight.
- WAF / rate limit перед nginx.
- access.log в Loki; метрики 5xx по upstream.

## Резюме

nginx — вход HTTP(S): статика, маршрутизация по Host, TLS termination, reverse proxy. **nginx -t** обязателен. **proxy_pass** со слэшем меняет URI — проверяйте таблицу. **502** — читайте error.log и проверяйте backend с той же машины, где nginx.

## Чек-лист

- Зачем `try_files`?
- Куда попадёт `/api/v1/x` при `location /api/` и `proxy_pass http://b/`?
- Чем `reload` отличается от `restart`?
- Где искать причину 502?

Следующий урок: [14. Лаба: reverse proxy](14-lab-nginx.md).
