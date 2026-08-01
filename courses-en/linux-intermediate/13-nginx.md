# 13. nginx: vhost, reverse proxy

> An in-depth course on the Docker stand: [nginx-basic](../nginx-basic/README.md) → [intermediate](../nginx-intermediate/README.md) ([`deploy/nginx`](../../deploy/nginx/README.md)). Here — nginx on a **VM** (`deploy/linux`).

## Intro: one IP — many sites

A user opens `https://shop.example.com` and `https://api.example.com`. The server IP is **the same**. **nginx** looks at the **Host** header (or SNI for HTTPS) and chooses: serve files from `/var/www/shop`, proxy to backend :8080, or return a 404.

Without a reverse proxy you'd have to expose a dozen ports to the internet. With nginx — **80/443 on the outside**, routing on the inside. In Kubernetes the same role is played by the **Ingress** — often nginx or traefik under the hood.

This chapter is about how to read a config, not fear a **reload**, and not fall into the **slash** trap in `proxy_pass`.

## What you'll learn

- The roles of the **master** and **worker** processes.
- The structure of `/etc/nginx` on Ubuntu/Debian.
- Assembling a **static** site and a **reverse proxy**.
- The **X-Forwarded-*** headers — why the backend expects them.
- Diagnosing a **502** from error.log.
- The "client URL → backend URI" table for `proxy_pass`.

## Processes: master and workers

```bash
ps aux | grep nginx
```

Usually:

- **master** (root) — reads the config, opens ports 80/443.
- **worker** (www-data) — handle connections.

Why this matters: files in the `DocumentRoot` must be **readable** by the **www-data** user, even if you edited the config as root.

```bash
sudo systemctl status nginx
sudo nginx -t
sudo systemctl reload nginx
```

| Action | Command | When |
|----------|---------|--------|
| Check syntax | `nginx -t` | **always** before reload |
| Pick up the config | `systemctl reload nginx` | after a successful -t |
| Full restart | `systemctl restart nginx` | rarely, drops connections |

## Configuration files

```text
/etc/nginx/
├── nginx.conf              # main file, include sites-enabled
├── sites-available/        # all vhosts
├── sites-enabled/          # symlink → active
├── snippets/               # shared fragments
└── ...
/var/log/nginx/
├── access.log
└── error.log
```

On Debian, **don't edit** `nginx.conf` unnecessarily — add a site to `sites-available/`.

## Static site — step by step

Contents of `sites-available/app`:

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

Breakdown:

| Directive | Meaning |
|-----------|--------|
| `listen 80` | accept HTTP on all IPv4 |
| `server_name` | which Host to serve |
| `root` | the directory of files on disk |
| `try_files` | file → directory/ → otherwise 404 |

Commands:

```bash
sudo mkdir -p /var/www/app
echo '<h1>Static app</h1>' | sudo tee /var/www/app/index.html
sudo nano /etc/nginx/sites-available/app
sudo ln -sf /etc/nginx/sites-available/app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
curl -s http://127.0.0.1/ -H 'Host: app.lab.local'
```

## Reverse proxy — the scheme

```mermaid
flowchart LR
  Browser[Browser]
  Nginx[nginx :80]
  Backend[app :8080]
  Browser -->|GET /api/users| Nginx
  Nginx -->|GET /users| Backend
```

Config:

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

### Headers — why the backend reads them

| Header | Why |
|-----------|--------|
| `Host` | the virtual host on the backend |
| `X-Real-IP` | the client's IP (for logs, rate limit) |
| `X-Forwarded-For` | the proxy chain |
| `X-Forwarded-Proto` | http or https (if TLS is on nginx) |

Without `X-Forwarded-Proto`, the application may build **http** links behind HTTPS termination.

### The slash in proxy_pass — the most common mistake

nginx matches `location /api/` against the request URI.

| Client request | proxy_pass | What goes to the backend |
|----------------|------------|------------------------|
| `GET /api/users` | `http://127.0.0.1:8080/` | `GET /users` |
| `GET /api/users` | `http://127.0.0.1:8080` | `GET /api/users` |
| `GET /api/users` | `http://127.0.0.1:8080/v1/` | `GET /v1/users` |

**Rule:** a slash **after** the IP in `proxy_pass` **strips** the location prefix (if the location also has `/api/`).

A mental check before deploy: "what path will my Node/Go/Python app see?"

## 502 Bad Gateway — nginx is alive, the backend isn't

The client sees a 502. nginx **accepted** the request but **didn't get** a proper response from the upstream.

```bash
tail -30 /var/log/nginx/error.log
```

Typical lines:

```text
connect() failed (111: Connection refused) while connecting to upstream
upstream timed out (110: Connection timed out)
```

Diagnostics **from the nginx server**:

```bash
curl -v http://127.0.0.1:8080/health
ss -tlnp | grep 8080
systemctl status myapp
```

In [lab 14](14-lab-nginx.md) you'll **deliberately** stop nginx on srv1 and see a 502 on lab.

## default_server and server_name

If the Host doesn't match any `server_name`, the **default_server** kicks in (the first listen with the `default_server` flag). Symptom: "I open the IP — I see someone else's site". Fix: an explicit default or the correct Host in curl.

## On the deploy/linux stand

| Host | Role |
|------|------|
| srv1 172.28.0.11 | backend :80 (nginx/apache) |
| lab 172.28.0.10 | proxy :8080 → srv1 |

Example: [`linux-basic/examples/nginx/lab-proxy.conf`](../linux-basic/examples/nginx/lab-proxy.conf)

## Common mistakes

| Symptom | Cause | Action |
|---------|---------|----------|
| 404 on the API | proxy_pass slash | the table above |
| 502 | backend down | curl the upstream, error.log |
| 403 static | www-data permissions | `namei -l`, chmod/chown |
| 413 body | client_max_body_size | increase it in nginx |
| reload fail | didn't run nginx -t | fix the syntax |

## In production

- Config in Git, deploy via Ansible/CI.
- **Canary**: two upstreams, weight.
- WAF / rate limit in front of nginx.
- access.log into Loki; 5xx metrics per upstream.

## Summary

nginx is the HTTP(S) entry point: static content, routing by Host, TLS termination, reverse proxy. **nginx -t** is mandatory. **proxy_pass** with a slash changes the URI — check the table. **502** — read error.log and check the backend from the same machine where nginx runs.

## Checklist

- Why `try_files`?
- Where does `/api/v1/x` land with `location /api/` and `proxy_pass http://b/`?
- How does `reload` differ from `restart`?
- Where do you look for the cause of a 502?

Next lesson: [14. Lab: reverse proxy](14-lab-nginx.md).
