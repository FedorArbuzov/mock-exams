# 19. Профилирование и оптимизация

## Введение

«Преждевременная оптимизация» — да. Но **измерять** перед фиксом — инженерная норма.

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

`py-spy` — sampling prod без изменения кода (awareness).

---

## Порядок оптимизации

1. Algorithm (O(n²) → O(n))
2. Fewer allocations / I/O
3. C extension / Rust / numba — last resort

[python-algorithms/02](../python-algorithms/02-complexity.md).

---

## Подзадачи

**Время:** ~50 мин.

### 19.1 Profile script (25 мин)

Найдите hot function в учебном slow script.

### 19.2 Fix (15 мин)

Один algorithmic fix; profile again.

### 19.3 Interview (10 мин)

«Как найдёте узкое место в Python сервисе?»

---

## Чек-лист

- [ ] cProfile used?
- [ ] algorithm before micro-opt?

**Дальше:** [20. Packaging](20-packaging.md).
