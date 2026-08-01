# 02. Lab: Jaeger and OTLP on the stack

## Goal

Bring up the **OTel + Jaeger** overlay, send a trace via **OTLP HTTP**, see the spans in the UI on **16686**, and add a scrape of the collector's metrics to Prometheus.

## Prerequisites

- Docker, **4+ GB RAM**.
- The base stack from [`deploy/observability`](../../deploy/observability/README.md).
- You've read [01-otel-traces](01-otel-traces.md).

---

## Task 1. Bring up the stack with traces

```bash
cd deploy/observability
docker compose -f docker-compose.yml -f docker-compose.otel.yml up -d --build
docker compose ps
```

| Service | URL |
|--------|-----|
| Jaeger UI | http://localhost:16686 |
| OTLP HTTP (collector) | http://localhost:4318 |
| Grafana | http://localhost:3000 (`admin` / `admin`) |

Smoke:

```bash
bash scripts/smoke.sh
bash scripts/traffic.sh
```

---

## Task 2. Send a trace manually (OTLP HTTP)

Copy the payload from [`examples/otel-span.json`](examples/otel-span.json) or use it as-is:

```bash
curl -sS -X POST "http://localhost:4318/v1/traces" \
  -H "Content-Type: application/json" \
  --data-binary @../../courses/observability-advanced/examples/otel-span.json
```

**What you'll see in Jaeger:**

1. Service: `demo-app`
2. Operation: `GET /health`
3. Child span: `redis.GET session:abc`

**If it's empty:** check `docker compose logs otel-collector` to confirm the `otlp` receiver is listening on `4318`.

---

## Task 3. Prometheus scrape of OTel metrics

The collector exports Prometheus metrics on `:8889`. Add a job (for the lab — merge `prometheus-otel.yml`):

Snippet from [`deploy/observability/config/prometheus-otel.yml`](../../deploy/observability/config/prometheus-otel.yml):

```yaml
  - job_name: otel-collector
    static_configs:
      - targets: ["otel-collector:8889"]
```

Restart Prometheus or mount the merged config (see the stack README). In Prometheus → **Targets** → `otel-collector` = **UP**.

Query to verify:

```promql
up{job="otel-collector"}
```

---

## Task 4. Tabletop: propagation

Draw 3 services on paper: `api` → `worker` → `redis`. Answer in writing:

1. Where is the **root span** created?
2. Which header does `api` pass to `worker`?
3. What breaks if `worker` publishes to SQS without trace context?

**Criterion:** a single continuous `trace_id` across the diagram.

---

## Task 5. (Optional) Relation to the Redis labs

Imagine the child span `redis.GET` is 800 ms. Which **two** Redis commands do you run first? (Hint: [redis-intermediate/15-monitoring](../redis-intermediate/15-monitoring.md).)

<details>
<summary>Answer</summary>

`redis-cli SLOWLOG GET 10` and `redis-cli INFO commandstats` (or `LATENCY DOCTOR`).
</details>

---

## If it doesn't work

| Symptom | Action |
|---------|----------|
| Jaeger empty | `curl` to `4318`; check `otel-collector` logs |
| `connection refused` 4318 | `docker compose ps` — the `mock-otel-collector` container |
| Prometheus `up=0` | target `otel-collector:8889` is reachable only from the compose network |
| OOM | `docker compose down -v`, bring it up without cAdvisor |

---

## Success criteria

- [ ] Jaeger shows a trace with a parent + child span
- [ ] `up{job="otel-collector"} == 1`
- [ ] The `traceparent` tabletop is filled in
- [ ] (Optional) You linked a trace to Redis SLOWLOG

## Cleanup

```bash
docker compose -f docker-compose.yml -f docker-compose.otel.yml down -v
```

Next lesson: [03-kube-prometheus.md](03-kube-prometheus.md).
