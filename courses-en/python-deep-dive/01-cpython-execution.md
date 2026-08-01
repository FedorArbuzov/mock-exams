# 01. CPython: how code runs

## Intro

"Python is slow" — without understanding **how** it runs, that answer is useless. CPython compiles `.py` into **bytecode**, and the VM executes it on C structures `PyObject*`.

---

## The source's path

```text
source.py → parser/AST → compiler → bytecode (.pyc) → CPython eval loop
```

```python
import dis

def add(a, b):
    return a + b

dis.dis(add)
```

Typical opcodes: `LOAD_FAST`, `BINARY_OP`, `RETURN_VALUE`.

---

## REPL vs script

| | REPL | script |
|--|------|--------|
| Module | `__main__` | `__name__ == "__main__"` |
| Restart | every line | once |

---

## Interpreters

| | CPython | PyPy | GraalPy |
|--|---------|------|---------|
| Reference | yes | JIT | JVM |
| In interviews | **focus** | "I know it exists" | rarely |

---

## Subtasks

**Time:** ~50 min.

### 1.1 dis (15 min)

Three functions: simple return, if/else, for loop — compare the opcode count.

### 1.2 `__pycache__` (10 min)

When a `.pyc` is created; what `PYTHONDONTWRITEBYTECODE` is for.

### 1.3 Out loud (15 min)

Explain the `.py` → execution path in 60 seconds.

### 1.4 Interview (10 min)

"Why isn't Python compiled to native code like C?" — draft an answer.

---

## Checklist

- [ ] Do you know dis.dis?
- [ ] Can you tell bytecode from machine code?

**Next:** [02. GIL](02-gil.md).
