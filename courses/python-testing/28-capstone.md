# 28. Capstone: production-ready test suite shop-lab

## Цель

Собрать **полный** test suite как в real team: layout, coverage gate, CI yaml, integration docs, interview-ready summary. **3–4 часа**.

## Требования

| # | Критерий | Проверка |
|---|----------|----------|
| 1 | `tests/unit/` — pricing, cart, users, async, hypothesis | `pytest tests/unit -v` |
| 2 | `tests/integration/` — gateway (+ optional postgres/sqlite) | `RUN_INTEGRATION=1 pytest tests/integration` |
| 3 | Coverage **≥85%** shop | `--cov-fail-under=85` |
| 4 | Markers: `integration`, `slow` documented | pyproject + README |
| 5 | `tests/integration/README.md` — how to run | human review |
| 6 | `.gitlab-ci.yml` **или** `examples/ci-gitlab-snippet.yml` | valid yaml |
| 7 | No live network in unit | grep / review |
| 8 | `tests/fakes/` или responses — HTTP isolated | review |
| 9 | `COVERAGE.md` — before/after metrics | file exists |
| 10 | `interview-cheatsheet.md` — self quiz без подглядывания | optional oral |

---

## Фаза 1. Audit (30 min)

```bash
cd courses/python-testing/examples
pytest tests/unit --cov=shop --cov-report=term-missing
pytest --collect-only -q
```

Запишите gaps в `COVERAGE.md`.

---

## Фаза 2. Unit completeness (60 min)

- [ ] pricing: parametrize + hypothesis
- [ ] cart: fixtures + edge cases
- [ ] users: mock + responses + fake (choose 2 styles documented)
- [ ] async_utils: asyncio tests
- [ ] repo/sqlite if implemented

---

## Фаза 3. Integration (45 min)

```bash
cd deploy/python-async && docker compose up -d
cd ../../courses/python-testing/examples
set RUN_INTEGRATION=1
pytest tests/integration -v
```

Document failure modes in integration README.

---

## Фаза 4. CI snippet (30 min)

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

## Фаза 5. Quality review (30 min)

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

## Фаза 6. Optional FastAPI bridge

Если прошли [`fastapi`](../fastapi/README.md) — добавьте `tests/integration/test_fastapi_app.py` против [`deploy/fastapi`](../../deploy/fastapi/README.md) `:8090`:

```python
@pytest.mark.integration
def test_fastapi_health():
    import httpx
    r = httpx.get("http://localhost:8090/health", timeout=5)
    assert r.status_code == 200
```

---

## Сдача (self-review)

| Вопрос | Ваш ответ |
|--------|-----------|
| Сколько unit vs integration tests? | |
| Coverage %? | |
| Как MR pipeline отличается от nightly? | |
| Один flaky test — ваши действия? | |

---

## Связь с карьерой

Portfolio: ссылка на repo + «pytest suite 85% cov, GitLab CI, integration docker».

---

## Поздравляем

Курс **python-testing** завершён. Шпаргалка: [interview-cheatsheet](interview-cheatsheet.md).

Дальше: [`fastapi/31-lab-testing`](../fastapi/31-lab-testing.md), [`python-async/28`](../python-async/28-lab-testing-async.md).
