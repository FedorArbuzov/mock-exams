# 15. Apache httpd (кратко)

## Введение: «у нас nginx, зачем Apache?»

На новых проектах фронт часто отдаёт nginx или CDN. Но в legacy вы откроете тикет: «поднять PHP-сайт на старом сервере» — и увидите **Apache** с `DocumentRoot /var/www/html`, `.htaccess` и `mod_php`. Или схему: **nginx** спереди (TLS, кэш), **Apache** сзади на порту 8080.

DevOps не обязан писать `.htaccess` каждый день, но обязан: **найти vhost**, **проверить configtest**, **прочитать error.log**, **не занять порт 80 дважды**.

## Что вы узнаете

- Как установить и проверить **apache2** на Ubuntu.
- Структуру **VirtualHost** и `DocumentRoot`.
- Команды **a2ensite**, **a2enmod** — включение сайтов и модулей.
- Схему **nginx → Apache** и почему два демона на одном :80 нельзя.
- Типичные ошибки **403**, **AH00558 bind**.

## Apache и nginx — одна роль, разный синтаксис

| Задача | nginx | Apache (Debian) |
|--------|-------|-----------------|
| Проверить конфиг | `nginx -t` | `apache2ctl configtest` |
| Перечитать конфиг | `systemctl reload apache2` | то же |
| Виртуальные хосты | `sites-available/` | `sites-available/` |
| Пользователь worker | `www-data` | `www-data` |
| Главный конфиг | `/etc/nginx/nginx.conf` | `/etc/apache2/apache2.conf` |

Оба читают запрос HTTP и отдают файлы или проксируют. Разница — **директивы** и **модули**.

## Установка и первый запрос

```bash
sudo apt update
sudo apt install -y apache2
systemctl status apache2
sudo apache2ctl configtest
curl -sI http://127.0.0.1/
```

Разбор `curl -sI`:

```text
HTTP/1.1 200 OK
Server: Apache/2.4.xx (Ubuntu)
...
```

`-I` — только заголовки, без тела. **200** — Apache слушает 80 и отвечает.

Файлы по умолчанию:

| Путь | Содержимое |
|------|------------|
| `/var/www/html/index.html` | дефолтная страница |
| `/etc/apache2/ports.conf` | `Listen 80` |
| `/etc/apache2/sites-enabled/000-default.conf` | default vhost |

## VirtualHost — несколько сайтов на одном IP

Браузер шлёт заголовок **Host: app.lab.local**. Apache выбирает блок `<VirtualHost>` с подходящим `ServerName`.

```apache
<VirtualHost *:80>
    ServerName app.lab.local
    ServerAdmin webmaster@localhost
    DocumentRoot /var/www/app

    <Directory /var/www/app>
        Options Indexes FollowSymLinks
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/app-error.log
    CustomLog ${APACHE_LOG_DIR}/app-access.log combined
</VirtualHost>
```

Пошагово на сервере:

```bash
sudo mkdir -p /var/www/app
echo '<h1>Apache app.lab.local</h1>' | sudo tee /var/www/app/index.html
sudo cp /path/to/app.conf /etc/apache2/sites-available/app.conf
sudo a2ensite app.conf
sudo a2dissite 000-default.conf
sudo apache2ctl configtest
sudo systemctl reload apache2
curl -s http://127.0.0.1/ -H 'Host: app.lab.local'
```

| Команда | Действие |
|---------|----------|
| `a2ensite NAME` | symlink в sites-enabled |
| `a2dissite NAME` | убрать сайт |
| `a2enmod rewrite` | включить mod_rewrite (.htaccess) |

## nginx перед Apache — типичная схема миграции

```text
Internet
    │
    ▼
nginx :443  (TLS, rate limit, static)
    │
    │ proxy_pass http://127.0.0.1:8080
    ▼
Apache :8080  (legacy PHP app)
```

В `ports.conf` Apache меняют на `Listen 8080`. nginx занимает 80/443. **Два процесса не могут слушать один порт** — получите ошибку bind.

## .htaccess и PHP (обзор)

- **mod_php** — PHP внутри процесса Apache (старый стиль).
- **php-fpm** — PHP отдельно, Apache проксирует на socket (современнее).

В тикете «500 Internal Server Error» смотрите:

```bash
tail -30 /var/log/apache2/error.log
```

## Логи

```bash
tail -f /var/log/apache2/access.log
tail -f /var/log/apache2/error.log
```

Формат access.log **combined** — IP, время, запрос, статус, User-Agent. Ищите 403, 404, 500.

## На стенде

[Лаба 16](16-lab-apache.md) — **srv2** (172.28.0.12). С **lab**: `curl http://172.28.0.12/`.

## Типичные ошибки

| Симптом | Причина | Действие |
|---------|---------|----------|
| AH00558: Could not bind to [:80] | nginx уже на 80 | другой порт или stop nginx |
| 403 Forbidden | Require all denied, нет x на каталог | права, Directory |
| 404 на vhost | ServerName не совпал | curl -H 'Host: ...' |
| Старый контент | не reload | `systemctl reload apache2` |
| .htaccess ignored | AllowOverride None | конфиг Directory |

## В продакшене

План миграции: Apache → nginx или app server. До миграции — инвентаризация vhost, DocumentRoot, cron. Не удаляйте 000-default, пока не проверили все домены.

## Резюме

Apache httpd — полноценный веб-сервер с VirtualHost и модулями. **apache2ctl configtest** перед reload. Часто стоит **за** nginx. На стенде srv2 — чтобы увидеть второй стек рядом с nginx на srv1.

## Чек-лист

- Чем `a2ensite` отличается от правки nginx sites-enabled?
- Почему nginx и Apache конфликтуют на :80?
- Где смотреть 500 ошибку?

Следующий урок: [16. Лаба: Apache](16-lab-apache.md).
