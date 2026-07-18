# 19. Типовые вопросы интервьюера

## Введение

После дизайна — **углубляющие** вопросы. Готовьте короткие ответы с trade-off.

---

## Процесс и принципы

| Вопрос | Угол ответа |
|--------|-------------|
| Почему не наследование? | composition, LSP |
| Как добавить новый тип? | OCP, registry |
| Как тестировать? | DI, fakes |
| Thread-safe? | locks, immutable VO |
| Persist? | Repository swap |

---

## Паттерны

| Вопрос | Ответ |
|--------|-------|
| Strategy vs State | intent: interchangeable alg vs internal transitions |
| Singleton? | module/DI, тесты |
| Factory vs Builder | simple vs multi-step construct |

---

## Python-specific

| Вопрос | Ответ |
|--------|-------|
| ABC vs Protocol | nominal vs structural |
| dataclass entity | frozen for VO |
| `__slots__` | memory, когда уместно |

[python-deep-dive](../python-deep-dive/README.md).

---

## Подзадачи

**Время:** ~50 мин.

### 19.1 Flash cards (25 мин)

10 Q&A — ответ 2 предложения каждый.

### 19.2 Weak spots (15 мин)

3 темы из self-check — перечитать главы.

### 19.3 Mock answer (10 мин)

Запишите голосом ответ «как сделать thread-safe LRU».

---

## Чек-лист

- [ ] 10 Q&A готовы?
- [ ] Python vs Java OOD отличия?

**Дальше:** [20. Синтез](20-synthesis.md).
