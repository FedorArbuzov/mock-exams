# 14. Coverage: pytest-cov, branch, fail_under

## Intro: "coverage 95%, but `if error: pass` isn't covered in prod"

Line coverage is green, but the `except: pass` branch was **never tested** — an incident in prod. **Branch coverage** and the **term-missing** report are the next level after "just pytest green".

## What you'll learn

- **`pytest --cov`** and its reports.
- **Branch coverage** — `if/else`, `except`.
- **`fail_under`** in pyproject and the CI gate.
- **What not to include** in coverage (tests, venv).

---

## Basic run

```bash
cd courses/python-testing/examples
pytest --cov=shop --cov-report=term-missing
pytest --cov=shop --cov-report=html
# open htmlcov/index.html
```

| Flag | Output |
|------|--------|
| `term-missing` | uncovered lines in the terminal |
| `html` | an interactive report |
| `xml` | for GitLab Cobertura |

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

CI fails on a coverage regression.

---

## What coverage doesn't catch

| Problem | Does coverage see it? |
|----------|-----------------|
| Wrong assert logic | no |
| Missing test case | partly (uncovered line) |
| Flaky test | no |
| Bad mock | no |

Coverage is **necessary**, not **sufficient**.

---

## Excluding from coverage

```python
def legacy_wrapper():  # pragma: no cover
    ...
```

Use rarely — with a comment explaining **why**.

---

## combine jobs

Parallel pytest (xdist) + coverage:

```bash
pytest -n auto --cov=shop --cov-append
```

For the course, single-process is enough.

---

## MR policy (rough)

| Gate | MR | main |
|------|-----|------|
| unit tests | required | required |
| fail_under 80% | required | required |
| integration | optional | nightly |

---

## Common mistakes

| Mistake | Consequence | What to do |
|--------|-------------|------------|
| cov on `tests/` | meaningless 100% | `source = shop` |
| assert `# noqa` everywhere | fake 100% | test behavior |
| fail_under 100% | slow dev | 80–90% + review |
| htmlcov in git | noise | .gitignore |

## Interview questions

- Line vs **branch** coverage?
- Why isn't 100% the goal?

## Summary

pytest-cov + term-missing finds the gaps. branch=true for if/except. fail_under in CI — a regression gate. Coverage complements, doesn't replace, good asserts.

Next: [15-lab-coverage](15-lab-coverage.md).
