# Python — Testing (specialization)

A course on **pytest** and its ecosystem: fixtures, mock, coverage, **Hypothesis**, HTTP/DB integration, **pytest-asyncio**, CI in GitLab. **28 lessons**, ~**14–18 hours**.

**Does not fully duplicate** [`fastapi/30-testing`](../fastapi/30-testing.md) (API) or [`python-async/27`](../python-async/27-pytest-asyncio.md) (async) — it provides a **shared foundation** for testing Python code.

**Prerequisites:** basic Python. Useful in parallel: [`gitlab-basic`](../gitlab-basic/README.md), [`fastapi`](../fastapi/README.md).

**Locally:** lab code — [`examples/`](examples/pyproject.toml) (the **`shop-lab`** package). Integration — [`deploy/python-async`](../../deploy/python-async/README.md) `:8095`, [`deploy/fastapi`](../../deploy/fastapi/README.md) `:8090`.

```bash
cd courses/python-testing/examples
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
# source .venv/bin/activate
pip install -e ".[dev]"
pytest -v
```

## How to read

1. **Theory** (01, 02, 04…) → **lab** (03, 05…) — you write tests in `examples/tests/`.
2. After **26** — [`interview-cheatsheet.md`](interview-cheatsheet.md).
3. [28-capstone.md](28-capstone.md) — **3–4 hours**.

**Time:** ~45–60 min per "theory + lab" pair; capstone — **3–4 h**; **the whole course ~18–24 h**.

## Curriculum (28 lessons)

### Phase 1. pytest basics (01–06)

| # | Lesson |
|---|------|
| 01 | [Testing landscape](01-testing-landscape.md) |
| 02 | [pytest: assert, discovery, running](02-pytest-basics.md) |
| 03 | [Lab: first tests](03-lab-first-tests.md) |
| 04 | [Fixtures: scope, autouse, yield](04-fixtures.md) |
| 05 | [Lab: fixtures for Cart](05-lab-fixtures.md) |
| 06 | [parametrize and markers](06-parametrize-markers.md) |

### Phase 2. Mock and isolation (07–11)

| 07 | [unittest.mock, patch, MagicMock](07-mocking-patch.md) |
| 08 | [Lab: mock HTTP](08-lab-mocking.md) |
| 09 | [monkeypatch, capsys, tmp_path](09-monkeypatch-capsys.md) |
| 10 | [Stub, fake, spy, pytest-mock](10-fakes-stubs.md) |
| 11 | [Lab: test doubles](11-lab-doubles.md) |

### Phase 3. Structure and quality (12–17)

| 12 | [conftest.py and project layout](12-conftest-layout.md) |
| 13 | [Lab: conftest hierarchy](13-lab-conftest.md) |
| 14 | [Coverage: pytest-cov, branch](14-coverage.md) |
| 15 | [Lab: coverage threshold in CI](15-lab-coverage.md) |
| 16 | [Property-based: Hypothesis](16-hypothesis.md) |
| 17 | [Lab: property tests for pricing](17-lab-hypothesis.md) |

### Phase 4. Integration (18–23)

| 18 | [DB tests: sqlite, transactions](18-integration-db.md) |
| 19 | [Lab: DB fixtures](19-lab-db-tests.md) |
| 20 | [HTTP: httpx, responses, respx](20-http-testing.md) |
| 21 | [Lab: mock external API](21-lab-http-mocks.md) |
| 22 | [Testcontainers overview](22-testcontainers.md) |
| 23 | [Lab: integration against a stand](23-lab-integration.md) |

### Phase 5. Async, CI, finale (24–28)

| 24 | [pytest-asyncio](24-pytest-asyncio.md) |
| 25 | [Lab: async tests](25-lab-async-tests.md) |
| 26 | [GitLab CI: pytest job](26-ci-gitlab.md) |
| 27 | [Flaky tests, xfail, debugging](27-flaky-debugging.md) |
| 28 | [Capstone: shop-lab test suite](28-capstone.md) |

| — | [Interview cheatsheet](interview-cheatsheet.md) |

## What you should end up with

- Building the **pyramid** of unit / integration / e2e.
- Writing **fixtures**, **parametrize**, **mock** without brittle tests.
- Setting up **coverage ≥80%** and **Hypothesis** for pricing.
- Testing **HTTP** and **async**; wiring **pytest** into **GitLab CI**.

## Related courses

| Course | Relation |
|------|-------|
| [`fastapi`](../fastapi/README.md) | TestClient, API integration (30–32) |
| [`python-async`](../python-async/README.md) | asyncio tests (27–28) |
| [`gitlab-basic`](../gitlab-basic/README.md) | pipeline, artifacts |
| [`gitlab-advanced`](../gitlab-advanced/README.md) | coverage reports, SAST |
| [`appsec-fundamentals`](../appsec-fundamentals/README.md) | security in SDLC |

## Examples

| Path | Purpose |
|------|------------|
| [`examples/src/shop/`](examples/src/shop/) | code under test |
| [`examples/tests/`](examples/tests/) | your tests in the labs |
| [`examples/pyproject.toml`](examples/pyproject.toml) | pytest + cov config |
