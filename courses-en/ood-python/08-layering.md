# 08. Repository, service, domain layer

## Intro

Even in a 45-min OOD problem it helps to separate **domain** and **infrastructure** — as in [fastapi/08](../fastapi/08-project-structure.md).

---

## Layers (lite)

```text
API / Facade  →  Service  →  Repository  →  Storage
```

| Layer | Knows about |
|------|--------|
| Domain entity | business rules |
| Service | use cases |
| Repository | CRUD interface |
| InMemoryRepo | dict / list |

---

## Example

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

## Sub-tasks

**Time:** ~55 min.

### 8.1 Bookstore layers (30 min)

3 classes + a Protocol repo on paper.

### 8.2 Test double (15 min)

`FakeBookRepo` for a unit test of the service.

### 8.3 Fat service smell (10 min)

When a service must not be bloated — the signs.

---

## Checklist

- [ ] Repository interface?
- [ ] Service without SQL strings?

**Next:** [09. Anti-patterns](09-anti-patterns.md).
