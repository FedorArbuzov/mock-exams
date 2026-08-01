# 19. Profiling and optimization

## Intro

"Premature optimization" — yes. But **measuring** before a fix is an engineering norm.

---

## cProfile

```bash
python -m cProfile -s cumtime script.py
```

```python
import cProfile
cProfile.run('main()', sort='cumtime')
```

---

## line_profiler / py-spy

`py-spy` — sampling in prod without changing code (awareness).

---

## Optimization order

1. Algorithm (O(n²) → O(n))
2. Fewer allocations / I/O
3. C extension / Rust / numba — last resort

[python-algorithms/02](../python-algorithms/02-complexity.md).

---

## Subtasks

**Time:** ~50 min.

### 19.1 Profile script (25 min)

Find the hot function in a practice slow script.

### 19.2 Fix (15 min)

One algorithmic fix; profile again.

### 19.3 Interview (10 min)

"How would you find a bottleneck in a Python service?"

---

## Checklist

- [ ] cProfile used?
- [ ] algorithm before micro-opt?

**Next:** [20. Packaging](20-packaging.md).
