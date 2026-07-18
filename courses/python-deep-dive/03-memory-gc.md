# 03. Память, ссылки, сборка мусора

## Введение

`a = [1,2]; b = a` — одна list в памяти, два имени. Понимание **ссылок** объясняет мутации, утечки и `del`.

---

## Reference counting

Каждый `PyObject` хранит `ob_refcnt`. `+1` при присвоении, `-1` при уходе ссылки; при 0 — освобождение.

```python
import sys
x = []
sys.getrefcount(x)  # завышен из-за временной ссылки в getrefcount
```

---

## Циклические ссылки

```python
a = []
b = []
a.append(b)
b.append(a)
del a, b  # refcount cycle → generational GC
```

**gc** module: `gc.collect()`, `gc.get_objects()` — для отладки, не для prod hot path.

---

## Generational GC

Три поколения объектов; молодые проверяются чаще. Собирает **циклы**, не трогает простые refcount-объекты.

---

## interning

Малые int, некоторые строки — переиспользование (`is` для `-5..256`).

---

## Подзадачи

**Время:** ~55 мин.

### 3.1 Diagram (15 мин)

Нарисуйте `a=[1]; b=a; a.append(2)` — ссылки до/после.

### 3.2 Cycle (15 мин)

Создайте цикл list↔list; `gc.collect()` — объясните.

### 3.3 `is` vs `==` (15 мин)

5 примеров где `is` True/False неочевидно.

### 3.4 Interview (10 мин)

«Как Python освобождает память?» — 90 сек.

---

## Чек-лист

- [ ] refcount + cyclic GC?
- [ ] Не путаете del с «удалить объект у всех»?

**Дальше:** [04. Object model](04-object-model.md).
