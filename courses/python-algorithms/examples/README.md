# Algo lab — практика курса python-algorithms

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -e ".[dev]"
pytest -v
```

## Структура

| Путь | Содержание |
|------|------------|
| `algo/structures.py` | `ListNode`, `TreeNode`, хелперы |
| `problems/ch*.py` | ваши решения (функции с TODO) |
| `tests/test_ch*.py` | автопроверка |

Решайте задачу в `problems/`, пока `pytest` не зелёный. Не подглядывайте в тесты до первой попытки.
