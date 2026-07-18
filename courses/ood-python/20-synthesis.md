# 20. Mock interview и capstone

## Введение

Финал: **полный прогон** 45 мин + план повторения перед реальным OOD.

---

## Mock script (самостоятельно)

1. Таймер 45 мин
2. Задача: Parking **или** Bookstore (чередуйте с LRU coding)
3. Запись экрана / голос — разбор пауз и «э-э»

[behavioral-interviews/04](../behavioral-interviews/04-star-method.md) — soft skills в том же слоте.

---

## Capstone checklist

| Область | Артефакт |
|---------|----------|
| SOLID | устный пример каждой буквы |
| 3 patterns | strategy, factory, state |
| 3 задачи | parking + LRU + rate limiter code |
| Layering | bookstore diagram |
| Tests | `pytest` green |

```bash
cd courses/ood-python/examples
pip install -e ".[dev]"
pytest
```

Сверка: [solutions/](examples/solutions/).

---

## Связь с другими курсами

| Курс | Связь |
|------|-------|
| [python-deep-dive](../python-deep-dive/README.md) | Protocol, dataclass |
| [python-algorithms](../python-algorithms/README.md) | LRU complexity |
| [api-design](../api-design/README.md) | rate limit API |
| [fastapi](../fastapi/README.md) | service layers |

---

## Подзадачи

**Время:** ~90 мин.

### 20.1 Full mock (45 мин)

Parking lot на доске + 5 мин Q&A сам с собой.

### 20.2 Code sprint (30 мин)

LRU + rate limiter без подсказок.

### 20.3 Retrospective (15 мин)

2 сильные стороны, 2 улучшения — в [interview-cheatsheet](interview-cheatsheet.md).

---

## Чек-лист курса

- [ ] Все 20 глав?
- [ ] Cheatsheet заполнен?
- [ ] examples pytest?

**Назад к оглавлению:** [README](README.md).
