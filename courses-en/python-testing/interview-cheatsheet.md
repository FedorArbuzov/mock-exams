# Interview cheatsheet — Python testing / pytest

Go through it **without peeking** after lesson 27. Full answers — in the course chapters.

---

## Pyramid and strategy

| Question | Direction of the answer |
|--------|-------------------|
| Unit vs integration vs e2e? | speed, scope, shop-lab example |
| Coverage 100% — a goal? | no; confidence + branch |
| When TDD? | new logic; test-after ok for scripts |
| Regression test? | a test before fixing the bug |

---

## pytest mechanics

| Question | Direction of the answer |
|--------|-------------------|
| Discovery rules? | test_*.py, test_* functions |
| assert vs unittest? | introspection diff |
| pytest.raises? | context manager, match= |
| Exit codes? | 0 ok, 1 fail, 5 no tests |

---

## Fixtures

| Question | Direction of the answer |
|--------|-------------------|
| scope function vs session? | mutable → function |
| yield fixture? | teardown guaranteed |
| conftest hierarchy? | merge up the tree |
| autouse risks? | hidden deps |

---

## Mock and doubles

| Question | Direction of the answer |
|--------|-------------------|
| patch where used? | import site |
| mock vs fake? | assert vs working impl |
| inject vs patch? | DI preferred |
| spec=? | typo protection |

---

## Integration

| Question | Direction of the answer |
|--------|-------------------|
| sqlite vs postgres test? | speed vs fidelity |
| responses vs live HTTP? | unit vs integration |
| RUN_INTEGRATION gate? | MR fast, nightly full |
| testcontainers? | docker session container |

---

## Async

| Question | Direction of the answer |
|--------|-------------------|
| pytest-asyncio auto mode? | async tests without a marker |
| AsyncMock? | awaitable mock |
| TestClient vs AsyncClient? | sync vs async API tests |

---

## CI and quality

| Question | Direction of the answer |
|--------|-------------------|
| cov-fail-under? | regression gate |
| cobertura xml? | GitLab coverage UI |
| flaky test policy? | xfail+ticket, fix root |
| -m "not integration"? | MR speed |

---

## Hypothesis

| Question | Direction of the answer |
|--------|-------------------|
| Shrinking? | minimal counterexample |
| assume()? | filter invalid inputs |
| vs parametrize? | generated vs explicit |

---

## System design (testing angle)

**"How to test a microservice with PostgreSQL and an external API?"**

1. Unit — domain + validators.
2. Integration — testcontainers postgres OR sqlite repo; responses for HTTP.
3. Contract — OpenAPI/schemathesis ( [`fastapi/32`](../fastapi/32-contract-tests.md) ).
4. E2E — compose smoke nightly.
5. CI split — MR unit; nightly integration.

---

## Self-check commands

```bash
cd courses/python-testing/examples
pytest tests/unit -v --cov=shop --cov-fail-under=85
pytest -m integration --collect-only
```

Capstone: [28-capstone](28-capstone.md).
