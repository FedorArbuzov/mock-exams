# Python — Testing (специализация)

Курс по **pytest** и экосистеме: фикстуры, mock, coverage, **Hypothesis**, HTTP/DB integration, **pytest-asyncio**, CI в GitLab. **28 уроков**, ~**14–18 часов**.

**Не дублирует** полностью [`fastapi/30-testing`](../fastapi/30-testing.md) (API) и [`python-async/27`](../python-async/27-pytest-asyncio.md) (async) — даёт **общий фундамент** тестирования Python-кода.

**Предварительно:** базовый Python. Полезно параллельно: [`gitlab-basic`](../gitlab-basic/README.md), [`fastapi`](../fastapi/README.md).

**Локально:** код лаб — [`examples/`](examples/pyproject.toml) (пакет **`shop-lab`**). Integration — [`deploy/python-async`](../../deploy/python-async/README.md) `:8095`, [`deploy/fastapi`](../../deploy/fastapi/README.md) `:8090`.

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

## Как читать

1. **Теория** (01, 02, 04…) → **лаба** (03, 05…) — пишете тесты в `examples/tests/`.
2. После **26** — [`interview-cheatsheet.md`](interview-cheatsheet.md).
3. [28-capstone.md](28-capstone.md) — **3–4 часа**.

**Время:** ~45–60 мин на пару «теория + лаба»; capstone — **3–4 ч**; **весь курс ~18–24 ч**.

## Программа (28 уроков)

### Фаза 1. Основы pytest (01–06)

| # | Урок |
|---|------|
| 01 | [Ландшафт тестирования](01-testing-landscape.md) |
| 02 | [pytest: assert, discovery, запуск](02-pytest-basics.md) |
| 03 | [Лаба: первые тесты](03-lab-first-tests.md) |
| 04 | [Fixtures: scope, autouse, yield](04-fixtures.md) |
| 05 | [Лаба: fixtures для Cart](05-lab-fixtures.md) |
| 06 | [parametrize и markers](06-parametrize-markers.md) |

### Фаза 2. Mock и изоляция (07–11)

| 07 | [unittest.mock, patch, MagicMock](07-mocking-patch.md) |
| 08 | [Лаба: mock HTTP](08-lab-mocking.md) |
| 09 | [monkeypatch, capsys, tmp_path](09-monkeypatch-capsys.md) |
| 10 | [Stub, fake, spy, pytest-mock](10-fakes-stubs.md) |
| 11 | [Лаба: test doubles](11-lab-doubles.md) |

### Фаза 3. Структура и качество (12–17)

| 12 | [conftest.py и layout проекта](12-conftest-layout.md) |
| 13 | [Лаба: иерархия conftest](13-lab-conftest.md) |
| 14 | [Coverage: pytest-cov, branch](14-coverage.md) |
| 15 | [Лаба: порог coverage в CI](15-lab-coverage.md) |
| 16 | [Property-based: Hypothesis](16-hypothesis.md) |
| 17 | [Лаба: property tests pricing](17-lab-hypothesis.md) |

### Фаза 4. Integration (18–23)

| 18 | [Тесты с БД: sqlite, transactions](18-integration-db.md) |
| 19 | [Лаба: DB fixtures](19-lab-db-tests.md) |
| 20 | [HTTP: httpx, responses, respx](20-http-testing.md) |
| 21 | [Лаба: mock external API](21-lab-http-mocks.md) |
| 22 | [Testcontainers overview](22-testcontainers.md) |
| 23 | [Лаба: integration против стенда](23-lab-integration.md) |

### Фаза 5. Async, CI, финал (24–28)

| 24 | [pytest-asyncio](24-pytest-asyncio.md) |
| 25 | [Лаба: async tests](25-lab-async-tests.md) |
| 26 | [GitLab CI: pytest job](26-ci-gitlab.md) |
| 27 | [Flaky tests, xfail, debugging](27-flaky-debugging.md) |
| 28 | [Capstone: test suite shop-lab](28-capstone.md) |

| — | [Interview cheatsheet](interview-cheatsheet.md) |

## Что должно получиться

- Строите **пирамиду** unit / integration / e2e.
- Пишете **fixtures**, **parametrize**, **mock** без хрупких тестов.
- Настраиваете **coverage ≥80%** и **Hypothesis** для pricing.
- Тестируете **HTTP** и **async**; подключаете **pytest** в **GitLab CI**.

## Связь с курсами

| Курс | Связь |
|------|-------|
| [`fastapi`](../fastapi/README.md) | TestClient, API integration (30–32) |
| [`python-async`](../python-async/README.md) | asyncio tests (27–28) |
| [`gitlab-basic`](../gitlab-basic/README.md) | pipeline, artifacts |
| [`gitlab-advanced`](../gitlab-advanced/README.md) | coverage reports, SAST |
| [`appsec-fundamentals`](../appsec-fundamentals/README.md) | security in SDLC |

## Примеры

| Путь | Назначение |
|------|------------|
| [`examples/src/shop/`](examples/src/shop/) | код под тесты |
| [`examples/tests/`](examples/tests/) | ваши тесты в лабах |
| [`examples/pyproject.toml`](examples/pyproject.toml) | pytest + cov config |
