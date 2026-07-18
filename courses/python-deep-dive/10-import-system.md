# 10. Import system

## Введение

`import foo` — поиск в `sys.path`, загрузка модуля **один раз** (`sys.modules` cache). Circular imports — архитектурная боль.

---

## Механика

```text
import pkg.mod
  → find_spec → load module → execute top-level
  → bind name in namespace
```

`from x import y` — атрибут, не копия (для mutable — осторожно).

---

## Circular import

| Fix | |
|-----|--|
| Отложенный import внутри функции | быстрый |
| Рефакторинг слоёв | правильный |
| TYPE_CHECKING block | для типов |

```python
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models import User
```

---

## `__init__.py` / namespace packages

PEP 420: папка без `__init__.py` может быть namespace package.

---

## Подзадачи

**Время:** ~50 мин.

### 10.1 sys.modules (15 мин)

`import json; del sys.modules['json']; import json` — что происходит.

### 10.2 Circular sketch (20 мин)

Два модуля A↔B — fix отложенным import.

### 10.3 Interview (15 мин)

«Что если два раза import module?»

---

## Чек-лист

- [ ] sys.modules cache?
- [ ] TYPE_CHECKING pattern?

**Дальше:** [11. Descriptors](11-descriptors.md).
