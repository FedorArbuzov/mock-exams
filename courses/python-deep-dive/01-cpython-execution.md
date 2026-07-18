# 01. CPython: как выполняется код

## Введение

«Python медленный» — без понимания **как** он выполняется, ответ бесполезен. CPython компилирует `.py` в **bytecode**, VM исполняет его на C-структурах `PyObject*`.

---

## Путь исходника

```text
source.py → parser/AST → compiler → bytecode (.pyc) → CPython eval loop
```

```python
import dis

def add(a, b):
    return a + b

dis.dis(add)
```

Типичные opcodes: `LOAD_FAST`, `BINARY_OP`, `RETURN_VALUE`.

---

## REPL vs script

| | REPL | script |
|--|------|--------|
| Модуль | `__main__` | `__name__ == "__main__"` |
| Перезапуск | каждая строка | один раз |

---

## Интерпретаторы

| | CPython | PyPy | GraalPy |
|--|---------|------|---------|
| Референс | да | JIT | JVM |
| На интервью | **фокус** | «знаю существует» | редко |

---

## Подзадачи

**Время:** ~50 мин.

### 1.1 dis (15 мин)

Три функции: simple return, if/else, for loop — сравните opcode count.

### 1.2 `__pycache__` (10 мин)

Когда создаётся `.pyc`; зачем `PYTHONDONTWRITEBYTECODE`.

### 1.3 Устно (15 мин)

Объясните путь `.py` → выполнение за 60 сек.

### 1.4 Interview (10 мин)

«Почему Python не компилируется в нативный код как C?» — черновик ответа.

---

## Чек-лист

- [ ] Знаете dis.dis?
- [ ] Отличаете bytecode от machine code?

**Дальше:** [02. GIL](02-gil.md).
