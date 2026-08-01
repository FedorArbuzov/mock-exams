# 20. Packaging, venv, interpreters

## Intro

In interviews: venv vs system Python, `pyproject.toml`, editable install, why "works on my machine."

---

## venv

```bash
python -m venv .venv
pip install -e ".[dev]"
```

Isolates site-packages.

---

## pyproject.toml

```toml
[project]
name = "myapp"
requires-python = ">=3.11"
dependencies = ["fastapi>=0.110"]
```

PEP 621 — the modern standard. `setup.py` is legacy.

---

## wheels vs sdist

| | wheel | sdist |
|--|-------|-------|
| Install | fast binary | build on install |

---

## Subtasks

**Time:** ~45 min.

### 20.1 Read pyproject (15 min)

Walk through [python-testing/examples/pyproject.toml](../python-testing/examples/pyproject.toml).

### 20.2 editable (10 min)

What does `pip install -e` do?

### 20.3 Interview (20 min)

"How do you manage dependencies in a project?"

---

## Checklist

- [ ] venv + pyproject?
- [ ] requires-python?

**Next:** [21. Interview Q&A](21-interview-qa.md).
