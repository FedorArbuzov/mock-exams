# 15. Apache httpd (briefly)

## Intro: "we use nginx, why Apache?"

On new projects, the front end is often served by nginx or a CDN. But in legacy you'll open a ticket: "bring up a PHP site on the old server" — and see **Apache** with `DocumentRoot /var/www/html`, `.htaccess`, and `mod_php`. Or a scheme: **nginx** in front (TLS, cache), **Apache** behind on port 8080.

DevOps isn't required to write `.htaccess` every day, but is required to: **find the vhost**, **run configtest**, **read error.log**, and **not bind port 80 twice**.

## What you'll learn

- How to install and check **apache2** on Ubuntu.
- The structure of a **VirtualHost** and `DocumentRoot`.
- The commands **a2ensite**, **a2enmod** — enabling sites and modules.
- The **nginx → Apache** scheme and why two daemons can't be on the same :80.
- Typical errors **403**, **AH00558 bind**.

## Apache and nginx — the same role, different syntax

| Task | nginx | Apache (Debian) |
|--------|-------|-----------------|
| Check the config | `nginx -t` | `apache2ctl configtest` |
| Reread the config | `systemctl reload apache2` | same |
| Virtual hosts | `sites-available/` | `sites-available/` |
| Worker user | `www-data` | `www-data` |
| Main config | `/etc/nginx/nginx.conf` | `/etc/apache2/apache2.conf` |

Both read an HTTP request and serve files or proxy. The difference — the **directives** and **modules**.

## Installation and the first request

```bash
sudo apt update
sudo apt install -y apache2
systemctl status apache2
sudo apache2ctl configtest
curl -sI http://127.0.0.1/
```

Breakdown of `curl -sI`:

```text
HTTP/1.1 200 OK
Server: Apache/2.4.xx (Ubuntu)
...
```

`-I` — headers only, no body. **200** — Apache is listening on 80 and responding.

Default files:

| Path | Content |
|------|------------|
| `/var/www/html/index.html` | the default page |
| `/etc/apache2/ports.conf` | `Listen 80` |
| `/etc/apache2/sites-enabled/000-default.conf` | the default vhost |

## VirtualHost — several sites on one IP

The browser sends the header **Host: app.lab.local**. Apache picks the `<VirtualHost>` block with the matching `ServerName`.

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

Step by step on the server:

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

| Command | Action |
|---------|----------|
| `a2ensite NAME` | symlink into sites-enabled |
| `a2dissite NAME` | remove a site |
| `a2enmod rewrite` | enable mod_rewrite (.htaccess) |

## nginx in front of Apache — a typical migration scheme

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

In Apache's `ports.conf` you change it to `Listen 8080`. nginx takes 80/443. **Two processes can't listen on the same port** — you'll get a bind error.

## .htaccess and PHP (overview)

- **mod_php** — PHP inside the Apache process (old style).
- **php-fpm** — PHP separate, Apache proxies to a socket (more modern).

For a "500 Internal Server Error" ticket, look at:

```bash
tail -30 /var/log/apache2/error.log
```

## Logs

```bash
tail -f /var/log/apache2/access.log
tail -f /var/log/apache2/error.log
```

The access.log **combined** format — IP, time, request, status, User-Agent. Look for 403, 404, 500.

## On the stand

[Lab 16](16-lab-apache.md) — **srv2** (172.28.0.12). From **lab**: `curl http://172.28.0.12/`.

## Common mistakes

| Symptom | Cause | Action |
|---------|---------|----------|
| AH00558: Could not bind to [:80] | nginx already on 80 | another port or stop nginx |
| 403 Forbidden | Require all denied, no x on the directory | permissions, Directory |
| 404 on the vhost | ServerName didn't match | curl -H 'Host: ...' |
| Old content | not reloaded | `systemctl reload apache2` |
| .htaccess ignored | AllowOverride None | Directory config |

## In production

Migration plan: Apache → nginx or an app server. Before migration — an inventory of vhosts, DocumentRoot, cron. Don't remove 000-default until you've checked all domains.

## Summary

Apache httpd is a full-fledged web server with VirtualHost and modules. **apache2ctl configtest** before reload. It often sits **behind** nginx. On the stand it's srv2 — to see a second stack alongside nginx on srv1.

## Checklist

- How does `a2ensite` differ from editing nginx sites-enabled?
- Why do nginx and Apache conflict on :80?
- Where do you look for a 500 error?

Next lesson: [16. Lab: Apache](16-lab-apache.md).
