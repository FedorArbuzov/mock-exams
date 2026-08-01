# 21. Interview Q&A: top questions

## How to use

For each question — **30–90 sec** out loud. The full course provides depth; here it's the **skeleton of an answer**. For details: the corresponding chapters.

---

## Language and runtime

### 1. What is the GIL?

A mutex in CPython: one thread executes bytecode. I/O releases the GIL; CPU-bound threads don't scale — use processes or native code. [02](02-gil.md)

### 2. How does Python manage memory?

Reference counting + generational GC for cycles. `del` removes a name, not necessarily the object. [03](03-memory-gc.md)

### 3. `is` vs `==`?

`==` is value equality (`__eq__`); `is` is identity (the same object). Use `is` for `None`, sentinels. [05](05-mutability-copy.md)

### 4. Mutable default argument?

The default is evaluated **once** at def; a mutable one is shared across calls. Fix: `None` + create inside. [05](05-mutability-copy.md)

### 5. Shallow vs deep copy?

Shallow — a new container, the inner references are the same; deep — recursively. [05](05-mutability-copy.md)

---

## OOP and the model

### 6. MRO and `super()`?

C3 linearization; `super()` is the next in the MRO, not just the parent. [04](04-object-model.md)

### 7. Descriptor?

`__get__`/`__set__` on a class; `property` is a descriptor. A data descriptor takes priority over the instance `__dict__`. [11](11-descriptors.md)

### 8. Metaclass — what for?

`type` creates a class; a metaclass customizes class creation. Rare; more often `__init_subclass__`. [13](13-metaclasses.md)

### 9. `__slots__`?

Fixed attrs, less memory, no free `__dict__`. [14](14-slots.md)

### 10. `__eq__` and `__hash__`?

Equal objects — same hash; mutable often `__hash__ = None`. [12](12-dunder-methods.md)

---

## Functions and iteration

### 11. Decorator?

`@f` = `func = f(func)`; preserve metadata with `functools.wraps`. [06](06-functions-decorators.md)

### 12. Closure?

An inner function + captured free variables in `__closure__`. [06](06-functions-decorators.md)

### 13. Generator vs iterator?

A generator is an iterator from a function with `yield`; lazy, one-shot iteration. [07](07-iterators-generators.md)

### 14. Context manager?

`__enter__`/`__exit__`; guarantees cleanup; `contextlib.contextmanager`. [08](08-context-managers.md)

---

## Concurrency

### 15. Thread vs process vs asyncio?

Threads: shared memory, GIL. Processes: separate memory, CPU parallel. Async: cooperative I/O on one thread. [02](02-gil.md), [17](17-threading-multiprocessing.md), [18](18-asyncio-internals.md)

### 16. Why is `time.sleep` bad in async?

It blocks the event loop — other coroutines don't run. [18](18-asyncio-internals.md)

### 17. How do you parallelize CPU in Python?

`multiprocessing`, `ProcessPoolExecutor`, a C/Rust extension; not threads. [17](17-threading-multiprocessing.md)

---

## Import and tooling

### 18. A repeated `import`?

The module is cached in `sys.modules` — executed once. [10](10-import-system.md)

### 19. Circular import — what to do?

Refactor layers; lazy import; `TYPE_CHECKING`. [10](10-import-system.md)

### 20. venv and pyproject?

venv isolates deps; pyproject — PEP 621 project metadata. [20](20-packaging.md)

---

## Subtasks

**Time:** ~90 min.

### 21.1 Flashcards (45 min)

21 questions — answer out loud without peeking; mark the weak ones.

### 21.2 Deep dive 5 (30 min)

5 weak ones — reread the chapter + a 3-minute answer.

### 21.3 Cheat sheet (15 min)

Add 5 questions from work to your notes.

---

## Checklist

- [ ] ≥15/21 confidently in 60 sec?
- [ ] Weak ones reviewed?

**Next:** [22. Synthesis](22-synthesis.md).
