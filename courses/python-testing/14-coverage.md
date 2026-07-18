# 14. Coverage: pytest-cov, branch, fail_under

## Введение: «coverage 95%, но if error: pass не покрыт в prod»

Line coverage зелёный, но ветка `except: pass` **никогда не тестировалась** — incident в prod. **Branch coverage** и **term-missing** report — следующий уровень после «просто pytest green».

## Что вы узнаете

- **`pytest --cov`** и отчёты.
- **Branch coverage** — `if/else`, `except`.
- **`fail_under`** в pyproject и CI gate.
- **Что не гонять** в coverage (tests, venv).

---

## Базовый запуск

```bash
cd courses/python-testing/examples
pytest --cov=shop --cov-report=term-missing
pytest --cov=shop --cov-report=html
# open htmlcov/index.html
```

| Flag | Output |
|------|--------|
| `term-missing` | строки без покрытия в терминале |
| `html` | интерактивный отчёт |
| `xml` | для GitLab Cobertura |

---

## pyproject config

[`examples/pyproject.toml`](examples/pyproject.toml):

```toml
[tool.coverage.run]
source = ["src/shop"]
branch = true
omit = ["*/tests/*"]

[tool.coverage.report]
fail_under = 80
show_missing = true
```

```bash
pytest --cov=shop --cov-fail-under=80
```

CI падает при регрессе coverage.

---

## Что coverage не ловит

| Проблема | Coverage видит? |
|----------|-----------------|
| Wrong assert logic | нет |
| Missing test case | частично (uncovered line) |
| Flaky test | нет |
| Bad mock | нет |

Coverage — **necessary**, not **sufficient**.

---

## Исключения из coverage

```python
def legacy_wrapper():  # pragma: no cover
    ...
```

Используйте редко — с комментарием **why**.

---

## combine jobs

Parallel pytest (xdist) + coverage:

```bash
pytest -n auto --cov=shop --cov-append
```

Для курса достаточно single-process.

---

## MR policy (ориентир)

| Gate | MR | main |
|------|-----|------|
| unit tests | required | required |
| fail_under 80% | required | required |
| integration | optional | nightly |

---

## Типичные ошибки

| Ошибка | Последствие | Что делать |
|--------|-------------|------------|
| cov на `tests/` | бессмысленные 100% | `source = shop` |
| assert `# noqa` everywhere | fake 100% | test behavior |
| fail_under 100% | slow dev | 80–90% + review |
| htmlcov в git | noise | .gitignore |

## На собеседовании

- Line vs **branch** coverage?
- Почему 100% — не цель?

## Резюме

pytest-cov + term-missing находит дыры. branch=true для if/except. fail_under в CI — regression gate. Coverage дополняет, не заменяет хорошие assert.

Далее: [15-lab-coverage](15-lab-coverage.md).
