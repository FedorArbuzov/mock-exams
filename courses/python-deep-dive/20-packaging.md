# 20. Packaging, venv, интерпретаторы

## Введение

На интервью: venv vs system Python, `pyproject.toml`, editable install, почему «works on my machine».

---

## venv

```bash
python -m venv .venv
pip install -e ".[dev]"
```

Изолирует site-packages.

---

## pyproject.toml

```toml
[project]
name = "myapp"
requires-python = ">=3.11"
dependencies = ["fastapi>=0.110"]
```

PEP 621 — modern standard. `setup.py` legacy.

---

## wheels vs sdist

| | wheel | sdist |
|--|-------|-------|
| Install | fast binary | build on install |

---

## Подзадачи

**Время:** ~45 мин.

### 20.1 Read pyproject (15 мин)

Разберите [python-testing/examples/pyproject.toml](../python-testing/examples/pyproject.toml).

### 20.2 editable (10 мин)

Что делает `pip install -e`?

### 20.3 Interview (20 мин)

«Как управляете зависимостями в проекте?»

---

## Чек-лист

- [ ] venv + pyproject?
- [ ] requires-python?

**Дальше:** [21. Interview Q&A](21-interview-qa.md).
