# nginx для курсов nginx-*

Edge **reverse proxy** + backends **static** (nginx) и **api** (Python). Порты на хосте: **8080** (HTTP), **8443** (HTTPS после генерации сертификатов).

Курсы: [nginx-basic](../../courses/nginx-basic/README.md), [nginx-intermediate](../../courses/nginx-intermediate/README.md).

Краткий обзор nginx в [linux-intermediate/13-nginx](../../courses/linux-intermediate/13-nginx.md) — здесь **углублённая практика** на Docker.

## Запуск

```bash
cd deploy/nginx
docker compose up -d --build
bash scripts/smoke.sh
```

| URL | Назначение |
|-----|------------|
| [http://localhost:8080/](http://localhost:8080/) | edge health |
| [http://localhost:8080/static/](http://localhost:8080/static/) | static backend |
| [http://localhost:8080/api/health](http://localhost:8080/api/health) | API |
| [http://localhost:8080/login](http://localhost:8080/login) | rate limit lab |
| [https://localhost:8443/](https://localhost:8443/) | TLS (после `gen-certs.sh`) |

## TLS (intermediate)

```bash
bash scripts/gen-certs.sh
docker compose exec edge nginx -t
docker compose exec edge nginx -s reload
curl -sk https://localhost:8443/api/health
```

Браузер покажет предупреждение о self-signed — для лаб это нормально.

## Отладка

```bash
docker compose logs -f edge
tail -f logs/error.log
docker compose exec edge nginx -t
docker compose exec edge nginx -s reload
```

Конфиги: `config/nginx.conf`, `config/conf.d/*.conf`.

## Сброс

```bash
docker compose down -v
```

## Troubleshooting

| Симптом | Действие |
|---------|----------|
| 502 на `/api/` | `docker compose logs api`, дождитесь healthcheck |
| 502 после правки conf | `nginx -t` в edge, проверьте `proxy_pass` trailing slash |
| HTTPS не стартует | нет `certs/server.crt` — запустите `gen-certs.sh` |
| 429 на `/login` | rate limit сработал — см. intermediate |

## Связанные курсы

- TLS теория: [linux-intermediate/09-tls-openssl](../../courses/linux-intermediate/09-tls-openssl.md)
- Ingress: [kuber-basic/16-ingress](../../courses/kuber-basic/16-ingress.md)
- Контейнерный nginx: [deploy/containers/stack/web](../containers/stack/web/nginx.conf)
