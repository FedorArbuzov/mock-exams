# 20. Mock interview and capstone

## Intro

The finale: a **full run** of 45 min + a revision plan before the real OOD.

---

## Mock script (on your own)

1. Timer 45 min
2. Problem: Parking **or** Bookstore (alternate with LRU coding)
3. Screen recording / voice — review pauses and "um"s

[behavioral-interviews/04](../behavioral-interviews/04-star-method.md) — soft skills in the same slot.

---

## Capstone checklist

| Area | Artifact |
|---------|----------|
| SOLID | an out-loud example of each letter |
| 3 patterns | strategy, factory, state |
| 3 problems | parking + LRU + rate limiter code |
| Layering | bookstore diagram |
| Tests | `pytest` green |

```bash
cd courses/ood-python/examples
pip install -e ".[dev]"
pytest
```

Check against: [solutions/](examples/solutions/).

---

## Related courses

| Course | Relation |
|------|-------|
| [python-deep-dive](../python-deep-dive/README.md) | Protocol, dataclass |
| [python-algorithms](../python-algorithms/README.md) | LRU complexity |
| [api-design](../api-design/README.md) | rate limit API |
| [fastapi](../fastapi/README.md) | service layers |

---

## Sub-tasks

**Time:** ~90 min.

### 20.1 Full mock (45 min)

Parking lot on the whiteboard + 5 min of Q&A with yourself.

### 20.2 Code sprint (30 min)

LRU + rate limiter without hints.

### 20.3 Retrospective (15 min)

2 strengths, 2 improvements — in [interview-cheatsheet](interview-cheatsheet.md).

---

## Course checklist

- [ ] All 20 chapters?
- [ ] Cheatsheet filled in?
- [ ] examples pytest?

**Back to the table of contents:** [README](README.md).
