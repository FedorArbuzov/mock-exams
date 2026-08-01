# Interview cheatsheet — Python Deep Dive

[README](README.md) · [21-interview-qa](21-interview-qa.md)

---

## GIL

One thread runs bytecode per process · released on I/O · CPU → **multiprocessing**

---

## Memory

**refcount** + **generational GC** (cycles) · `del` drops name

---

## is vs ==

`==` value · `is` identity · `None` use `is`

---

## Mutable default

`def f(a=None): a = a or []` — not `def f(a=[])`

---

## MRO / super

C3 order · `super()` = next in MRO

---

## Descriptor

`__get__`/`__set__` on class · **property** is descriptor

---

## Decorator

`@d` → `f = d(f)` · **functools.wraps**

---

## Generator

`yield` · lazy · one-shot iterator

---

## Concurrency pick

| Task | Tool |
|------|------|
| I/O many | asyncio |
| I/O legacy sync | threads |
| CPU | ProcessPool |

---

## import

**sys.modules** cache · circular → lazy import / refactor

---

## Profile

**cProfile** cumtime · fix algorithm first

---

## Related

[python-async](../python-async/README.md) · [python-algorithms](../python-algorithms/README.md)
