# 08. Repository, service, domain layer

## Введение

Даже в OOD-задаче на 45 мин полезно разделить **domain** и **infrastructure** — как в [fastapi/08](../fastapi/08-project-structure.md).

---

## Слои (lite)

```text
API / Facade  →  Service  →  Repository  →  Storage
```

| Слой | Знает |
|------|--------|
| Domain entity | бизнес-правила |
| Service | use cases |
| Repository | CRUD interface |
| InMemoryRepo | dict / list |

---

## Пример

```python
class BookRepository(Protocol):
    def find(self, isbn: str) -> Book | None: ...
    def save(self, book: Book) -> None: ...

class CatalogService:
    def __init__(self, repo: BookRepository):
        self._repo = repo
    def add_book(self, book: Book) -> None:
        if self._repo.find(book.isbn):
            raise DuplicateISBN()
        self._repo.save(book)
```

---

## Подзадачи

**Время:** ~55 мин.

### 8.1 Bookstore layers (30 мин)

3 класса + Protocol repo на бумаге.

### 8.2 Test double (15 мин)

`FakeBookRepo` для unit test service.

### 8.3 Fat service smell (10 мин)

Когда service раздувать нельзя — признаки.

---

## Чек-лист

- [ ] Repository interface?
- [ ] Service без SQL strings?

**Дальше:** [09. Anti-patterns](09-anti-patterns.md).
