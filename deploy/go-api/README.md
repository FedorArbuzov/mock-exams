# Go API stand for go-intermediate

Stack: **Go (Chi)** → **PostgreSQL 16**. No Redis here — that lands in `go-advanced`.

Course: [go-intermediate](../../courses-en/go-intermediate/README.md).

## Start

```bash
cd deploy/go-api
docker compose up -d --build
```

| Service | URL |
|--------|-----|
| API | [http://localhost:8099](http://localhost:8099) |
| Health | [http://localhost:8099/health](http://localhost:8099/health) |
| Items | [http://localhost:8099/api/v1/items](http://localhost:8099/api/v1/items) |

Postgres is **not** published to the host — only inside compose. For direct `psql`, use [`deploy/postgres`](../postgres/README.md) (port `5432`) or `docker exec` into this stack's postgres.

## Smoke

```bash
bash scripts/smoke.sh
# .\scripts\smoke.ps1
```

## Useful commands

```bash
docker compose ps
docker compose logs -f api
docker exec -it mock-go-api sh
docker exec mock-go-api-postgres psql -U course -d course -c '\dt'
```

## Reset

```bash
docker compose down -v --rmi local
```

## Troubleshooting

| Symptom | Action |
|---------|--------|
| `8099` busy | change the host port in `docker-compose.yml` |
| api unhealthy | `docker compose logs api`, wait for postgres health |
| conflict with another postgres compose | stop the other stack or don't run both at once |

## Local development (without Docker for the API)

```bash
cd deploy/go-api/stack/api
# need Postgres reachable — e.g. compose postgres with a published port, or deploy/postgres
export DATABASE_URL=postgres://course:course@localhost:5432/course?sslmode=disable
export HTTP_ADDR=:8099
go run ./cmd/api
```
