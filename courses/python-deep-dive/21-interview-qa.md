# 21. Interview Q&A: топ вопросов

## Как пользоваться

На каждый вопрос — **30–90 сек** вслух. Полный курс даёт глубину; здесь — **скелет ответа**. Развёрнуто: соответствующие главы.

---

## Язык и runtime

### 1. Что такое GIL?

Mutex в CPython: один поток выполняет bytecode. I/O отпускает GIL; CPU-bound threads не масштабируются — processes или native code. [02](02-gil.md)

### 2. Как Python управляет памятью?

Reference counting + generational GC для циклов. `del` убирает имя, не обязательно объект. [03](03-memory-gc.md)

### 3. `is` vs `==`?

`==` value equality (`__eq__`); `is` identity (тот же объект). `is` для `None`, sentinels. [05](05-mutability-copy.md)

### 4. Mutable default argument?

Default вычисляется **один раз** при def; mutable shared между вызовами. Fix: `None` + create inside. [05](05-mutability-copy.md)

### 5. Shallow vs deep copy?

Shallow — новый контейнер, inner ссылки те же; deep — рекурсивно. [05](05-mutability-copy.md)

---

## ООП и модель

### 6. MRO и `super()`?

C3 linearization; `super()` — следующий в MRO, не только parent. [04](04-object-model.md)

### 7. Descriptor?

`__get__`/`__set__` на class; `property` — descriptor. Data descriptor приоритетнее instance `__dict__`. [11](11-descriptors.md)

### 8. Metaclass — зачем?

Класс создаёт `type`; metaclass кастомизирует создание class. Редко; чаще `__init_subclass__`. [13](13-metaclasses.md)

### 9. `__slots__`?

Фиксированные attrs, меньше памяти, нет свободного `__dict__`. [14](14-slots.md)

### 10. `__eq__` и `__hash__`?

Equal objects — same hash; mutable often `__hash__ = None`. [12](12-dunder-methods.md)

---

## Функции и итерация

### 11. Decorator?

`@f` = `func = f(func)`; сохранять metadata `functools.wraps`. [06](06-functions-decorators.md)

### 12. Closure?

Inner function + captured free variables в `__closure__`. [06](06-functions-decorators.md)

### 13. Generator vs iterator?

Generator — iterator from function with `yield`; lazy, one-shot iteration. [07](07-iterators-generators.md)

### 14. Context manager?

`__enter__`/`__exit__`; guarantee cleanup; `contextlib.contextmanager`. [08](08-context-managers.md)

---

## Concurrency

### 15. Thread vs process vs asyncio?

Threads: shared memory, GIL. Processes: separate memory, CPU parallel. Async: cooperative I/O one thread. [02](02-gil.md), [17](17-threading-multiprocessing.md), [18](18-asyncio-internals.md)

### 16. Почему `time.sleep` в async плохо?

Блокирует event loop — другие coroutines не run. [18](18-asyncio-internals.md)

### 17. Как распараллелить CPU в Python?

`multiprocessing`, `ProcessPoolExecutor`, C/Rust extension; не threads. [17](17-threading-multiprocessing.md)

---

## Import и tooling

### 18. Повторный `import`?

Модуль кэшируется в `sys.modules` — execute once. [10](10-import-system.md)

### 19. Circular import — что делать?

Refactor layers; lazy import; `TYPE_CHECKING`. [10](10-import-system.md)

### 20. venv и pyproject?

venv изолирует deps; pyproject — PEP 621 project metadata. [20](20-packaging.md)

---

## Подзадачи

**Время:** ~90 мин.

### 21.1 Flashcards (45 мин)

21 вопрос — ответ вслух без подглядывания; отметьте слабые.

### 21.2 Deep dive 5 (30 мин)

5 слабых — перечитайте главу + 3 мин ответ.

### 21.3 Cheat sheet (15 мин)

Дополните свою заметку 5 вопросами из работы.

---

## Чек-лист

- [ ] ≥15/21 уверенно за 60 сек?
- [ ] Слабые повторены?

**Дальше:** [22. Синтез](22-synthesis.md).
