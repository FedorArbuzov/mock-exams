# 20. Лаба: report pipeline (chain + group)

## Сценарий

Analytics хочет: **3 отчёта параллельно** (daily, weekly, monthly), затем **summary task**.

**Цель:** реализовать canvas workflow и trigger из shell/API.

---

## Шаг 1. Helper tasks

```python
# shop/tasks.py
@shared_task(name="shop.tasks.fetch_metrics")
def fetch_metrics(period: str) -> dict:
    time.sleep(0.5)
    return {"period": period, "rows": 100}

@shared_task(name="shop.tasks.merge_reports")
def merge_reports(results: list) -> dict:
    return {"merged": len(results), "periods": [r["period"] for r in results]}
```

---

## Шаг 2. chord workflow

```python
from celery import chord, group
from shop.tasks import fetch_metrics, merge_reports

workflow = chord(
    group(fetch_metrics.s(p) for p in ("daily", "weekly", "monthly")),
    merge_reports.s(),
)
async_result = workflow.apply_async()
async_result.get(timeout=30)
```

Run in `docker exec -it mock-celery-api python`.

---

## Шаг 3. chain variant

```python
from celery import chain
from shop.tasks import generate_report, ping

chain(generate_report.s("daily"), ping.s())()
# ping ignores report result if using .s() wrong — use .si() for immutable next step
```

Experiment with `.si()` — immutable signature, ignores previous result.

---

## Шаг 4. API endpoint (optional)

```python
@app.post("/reports/pipeline/")
def run_pipeline():
    from celery import chord, group
    from shop.tasks import fetch_metrics, merge_reports
    w = chord(group(fetch_metrics.s(p) for p in ("daily", "weekly")), merge_reports.s())
    r = w.apply_async()
    return {"workflow_id": r.id}
```

---

## Шаг 5. Flower

Watch 3 parallel `fetch_metrics` + 1 `merge_reports`.

---

## Критерии приёмки

- [ ] chord completes with merged dict
- [ ] Parallel tasks visible in Flower
- [ ] Failure in one fetch_metrics blocks merge (test by raising in one period)

Далее: [21-celery-beat](21-celery-beat.md).
