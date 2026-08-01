# 28. Capstone: a production-ready test suite for shop-lab

## Goal

Assemble a **complete** test suite like a real team's: layout, coverage gate, CI yaml, integration docs, interview-ready summary. **3–4 hours**.

## Requirements

| # | Criterion | Verification |
|---|----------|----------|
| 1 | `tests/unit/` — pricing, cart, users, async, hypothesis | `pytest tests/unit -v` |
| 2 | `tests/integration/` — gateway (+ optional postgres/sqlite) | `RUN_INTEGRATION=1 pytest tests/integration` |
| 3 | Coverage **≥85%** of shop | `--cov-fail-under=85` |
| 4 | Markers: `integration`, `slow` documented | pyproject + README |
| 5 | `tests/integration/README.md` — how to run | human review |
| 6 | `.gitlab-ci.yml` **or** `examples/ci-gitlab-snippet.yml` | valid yaml |
| 7 | No live network in unit | grep / review |
| 8 | `tests/fakes/` or responses — HTTP isolated | review |
| 9 | `COVERAGE.md` — before/after metrics | file exists |
| 10 | `interview-cheatsheet.md` — self quiz without peeking | optional oral |

---

## Phase 1. Audit (30 min)

```bash
cd courses/python-testing/examples
pytest tests/unit --cov=shop --cov-report=term-missing
pytest --collect-only -q
```

Record the gaps in `COVERAGE.md`.

---

## Phase 2. Unit completeness (60 min)

- [ ] pricing: parametrize + hypothesis
- [ ] cart: fixtures + edge cases
- [ ] users: mock + responses + fake (choose 2 styles documented)
- [ ] async_utils: asyncio tests
- [ ] repo/sqlite if implemented

---

## Phase 3. Integration (45 min)

```bash
cd deploy/python-async && docker compose up -d
cd ../../courses/python-testing/examples
set RUN_INTEGRATION=1
pytest tests/integration -v
```

Document failure modes in the integration README.

---

## Phase 4. CI snippet (30 min)

Create `examples/ci-gitlab-snippet.yml`:

```yaml
# Copy into .gitlab-ci.yml — adjust paths
pytest-unit:
  image: python:3.12-slim
  script:
    - cd courses/python-testing/examples
    - pip install -e ".[dev]"
    - pytest tests/unit --cov=shop --cov-fail-under=85 -m "not slow"
```

---

## Phase 5. Quality review (30 min)

Checklist:

- [ ] Each test name describes behavior
- [ ] No duplicate coverage (same assert 5 times)
- [ ] Exceptions tested with `pytest.raises`
- [ ] HTTP URLs consistent
- [ ] Decimal not float

Run:

```bash
pytest tests/unit -v --tb=short
```

---

## Phase 6. Optional FastAPI bridge

If you've done [`fastapi`](../fastapi/README.md) — add `tests/integration/test_fastapi_app.py` against [`deploy/fastapi`](../../deploy/fastapi/README.md) `:8090`:

```python
@pytest.mark.integration
def test_fastapi_health():
    import httpx
    r = httpx.get("http://localhost:8090/health", timeout=5)
    assert r.status_code == 200
```

---

## Submission (self-review)

| Question | Your answer |
|--------|-----------|
| How many unit vs integration tests? | |
| Coverage %? | |
| How does the MR pipeline differ from nightly? | |
| A single flaky test — your actions? | |

---

## Career connection

Portfolio: a link to the repo + "pytest suite 85% cov, GitLab CI, integration docker".

---

## Congratulations

The **python-testing** course is complete. Cheatsheet: [interview-cheatsheet](interview-cheatsheet.md).

Next: [`fastapi/31-lab-testing`](../fastapi/31-lab-testing.md), [`python-async/28`](../python-async/28-lab-testing-async.md).
