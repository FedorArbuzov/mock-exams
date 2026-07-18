# Interview cheatsheet — Python testing / pytest

Пройдите **без подглядывания** после урока 27. Полные ответы — в главах курса.

---

## Пирамида и стратегия

| Вопрос | Направление ответа |
|--------|-------------------|
| Unit vs integration vs e2e? | скорость, scope, пример shop-lab |
| Coverage 100% — цель? | нет; confidence + branch |
| TDD когда? | новая logic; test-after ok для scripts |
| Regression test? | test до fix бага |

---

## pytest mechanics

| Вопрос | Направление ответа |
|--------|-------------------|
| Discovery rules? | test_*.py, test_* functions |
| assert vs unittest? | introspection diff |
| pytest.raises? | context manager, match= |
| Exit codes? | 0 ok, 1 fail, 5 no tests |

---

## Fixtures

| Вопрос | Направление ответа |
|--------|-------------------|
| scope function vs session? | mutable → function |
| yield fixture? | teardown guaranteed |
| conftest hierarchy? | merge up tree |
| autouse риски? | hidden deps |

---

## Mock и doubles

| Вопрос | Направление ответа |
|--------|-------------------|
| patch where used? | import site |
| mock vs fake? | assert vs working impl |
| inject vs patch? | DI preferred |
| spec=? | typo protection |

---

## Integration

| Вопрос | Направление ответа |
|--------|-------------------|
| sqlite vs postgres test? | speed vs fidelity |
| responses vs live HTTP? | unit vs integration |
| RUN_INTEGRATION gate? | MR fast, nightly full |
| testcontainers? | docker session container |

---

## Async

| Вопрос | Направление ответа |
|--------|-------------------|
| pytest-asyncio auto mode? | async tests without marker |
| AsyncMock? | awaitable mock |
| TestClient vs AsyncClient? | sync vs async API tests |

---

## CI и quality

| Вопрос | Направление ответа |
|--------|-------------------|
| cov-fail-under? | regression gate |
| cobertura xml? | GitLab coverage UI |
| flaky test policy? | xfail+ticket, fix root |
| -m "not integration"? | MR speed |

---

## Hypothesis

| Вопрос | Направление ответа |
|--------|-------------------|
| Shrinking? | minimal counterexample |
| assume()? | filter invalid inputs |
| vs parametrize? | generated vs explicit |

---

## System design (testing angle)

**«Как тестировать microservice с PostgreSQL и external API?»**

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
