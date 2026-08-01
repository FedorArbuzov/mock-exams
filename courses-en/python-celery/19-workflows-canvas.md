# 19. chain, group, chord, canvas

## Introduction

"Generate a report → if OK send an email → update the dashboard" — three tasks, **order matters**. Celery **canvas** composes workflows.

## What you'll learn

- `chain`, `group`, `chord`, `signature`.
- Parallel vs sequential execution.
- Error propagation.

---

## signature (`.s()`)

Partial task — args frozen for workflow:

```python
from shop.tasks import add, generate_report

add.s(2, 3)  # not executed yet
```

---

## chain — sequential

```python
from celery import chain

workflow = chain(
    generate_report.s("daily"),
    add.s(10),  # receives previous result as first arg — careful with signatures
)
result = workflow.apply_async()
result.get(timeout=60)
```

Each task output → next task input (if signature matches).

**Pattern for report pipeline:**

```python
from celery import chain

pipeline = chain(
    fetch_data.s("orders"),
    transform_data.s(),
    save_report.s(),
)
```

---

## group — parallel

```python
from celery import group

job = group(
    add.s(1, 1),
    add.s(2, 2),
    add.s(3, 3),
)
result = job.apply_async()
result.get(timeout=30)  # list [2, 4, 6]
```

Fan-out independent subtasks — aggregate in chord.

---

## chord — group + callback

```python
from celery import chord

workflow = chord(
    group(add.s(i, i) for i in range(5)),
    add.s(100),  # callback: sum results? needs custom task
)
```

Callback runs **after all** group tasks succeed. One failure → chord fails.

---

## Error handling

| Pattern | On failure |
|---------|------------|
| chain | stops mid-chain |
| group | partial results, join raises |
| chord | callback not run |

Use `link_error` for cleanup tasks (advanced).

---

## vs raw orchestration

| Canvas | Alternative |
|--------|-------------|
| chain | state machine in DB |
| chord | separate coordinator task |
| group | asyncio gather in one mega-task (anti-pattern) |

For long workflows — consider **Temporal**, **Prefect**, or DB state machine.

---

## Common mistakes

| Mistake | Fix |
|--------|-----|
| Wrong signature arity in chain | `.si()` immutable signature |
| Huge group | batch + chord |
| chord without result backend | backend required for chord |

## Summary

`chain` = pipeline. `group` = parallel. `chord` = parallel then aggregate. Use `.s()` / `.si()`. Chord needs result backend.

Next: [20-lab-pipeline](20-lab-pipeline.md).
