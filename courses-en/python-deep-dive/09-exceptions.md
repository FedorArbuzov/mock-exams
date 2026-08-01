# 09. Exceptions

## Intro

`except Exception` catches almost everything — do **not** catch `KeyboardInterrupt` without a reason. The hierarchy: `BaseException` → `Exception` → specific ones.

---

## Best practices

```python
try:
    ...
except SpecificError as e:
    ...
else:
    ...  # no exception
finally:
    ...  # always
```

| Antipattern | Why |
|--------------|--------|
| bare `except:` | hides bugs |
| pass in except | silent failure |
| exceptions for flow control | slow, unreadable |

---

## Exception chaining

```python
raise NewError("context") from original
```

`__cause__` in the traceback.

---

## Subtasks

**Time:** ~50 min.

### 9.1 Hierarchy (15 min)

Draw the BaseException tree (5 branches).

### 9.2 Refactor (20 min)

A flat `except Exception` → specific from your code (for practice).

### 9.3 Interview (15 min)

"When won't finally run?" (process kill, os._exit).

---

## Checklist

- [ ] Specific except?
- [ ] raise from?

**Next:** [10. Import](10-import-system.md).
