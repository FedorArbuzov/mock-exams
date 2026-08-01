# 10. Import system

## Intro

`import foo` — a lookup in `sys.path`, loading the module **once** (`sys.modules` cache). Circular imports are an architectural pain.

---

## Mechanics

```text
import pkg.mod
  → find_spec → load module → execute top-level
  → bind name in namespace
```

`from x import y` — an attribute, not a copy (be careful with mutable ones).

---

## Circular import

| Fix | |
|-----|--|
| Deferred import inside a function | quick |
| Refactoring layers | the right way |
| TYPE_CHECKING block | for types |

```python
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models import User
```

---

## `__init__.py` / namespace packages

PEP 420: a folder without `__init__.py` can be a namespace package.

---

## Subtasks

**Time:** ~50 min.

### 10.1 sys.modules (15 min)

`import json; del sys.modules['json']; import json` — what happens.

### 10.2 Circular sketch (20 min)

Two modules A↔B — fix with a deferred import.

### 10.3 Interview (15 min)

"What if you import a module twice?"

---

## Checklist

- [ ] sys.modules cache?
- [ ] TYPE_CHECKING pattern?

**Next:** [11. Descriptors](11-descriptors.md).
