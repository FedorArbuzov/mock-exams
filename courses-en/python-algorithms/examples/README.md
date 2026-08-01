# Algo lab — practice for the python-algorithms course

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -e ".[dev]"
pytest -v
```

## Structure

| Path | Contents |
|------|------------|
| `algo/structures.py` | `ListNode`, `TreeNode`, helpers |
| `problems/ch*.py` | your solutions (functions with TODO) |
| `tests/test_ch*.py` | automated checks |

Solve the problem in `problems/` until `pytest` is green. Don't peek at the tests before your first attempt.
