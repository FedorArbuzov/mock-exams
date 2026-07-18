# 02. SOLID на Python

## Введение

SOLID — язык для **обоснования** дизайна на интервью, не магические буквы на каждый класс.

---

## S — Single Responsibility

Один класс — одна причина для изменения.

```python
# плохо: ReportGenerator и saves to disk
# хорошо: ReportBuilder + FileExporter
```

---

## O — Open/Closed

Открыт для расширения, закрыт для модификации.

```python
class PaymentProcessor(ABC):
    @abstractmethod
    def charge(self, amount: Decimal) -> str: ...

class StripeProcessor(PaymentProcessor): ...
```

Новый провайдер — новый класс, не правка `if provider ==`.

---

## L — Liskov Substitution

Подкласс не ломает контракт базового. `Square`/`Rectangle` — классический контрпример.

---

## I — Interface Segregation

Мелкие Protocol вместо «бог-интерфейса».

---

## D — Dependency Inversion

Зависимость от абстракции:

```python
class OrderService:
    def __init__(self, repo: OrderRepository): ...
```

---

## Подзадачи

**Время:** ~55 мин.

### 2.1 Нарушение S (15 мин)

Найдите в своём коде класс с 2+ ответственностями; разделите на бумаге.

### 2.2 OCP (15 мин)

`Notifier`: Email/SMS без `if type`.

### 2.3 DIP (15 мин)

`BookService` + `InMemoryRepo` / `PostgresRepo` конструктор.

### 2.4 Устно (10 мин)

Объясните один принцип за 60 сек с примером.

---

## Чек-лист

- [ ] Можете назвать все 5?
- [ ] Пример DIP из практики?

**Дальше:** [03. Композиция](03-composition-interfaces.md).
