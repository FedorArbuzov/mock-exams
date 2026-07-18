# 17. URL Shortener (OOD slice)

## Введение

Полный design — system design; на OOD — **encode/decode**, storage interface, collision.

[api-design](../api-design/README.md), [redis](../redis/README.md) для scale.

---

## OOD scope (45 min)

```python
class UrlRepository(Protocol):
    def save(self, short: str, long: str) -> None: ...
    def get(self, short: str) -> str | None: ...

class ShortenerService:
    def shorten(self, url: str) -> str: ...
    def resolve(self, code: str) -> str: ...
```

---

## Encoding

- Base62 counter
- Hash + collision retry
- UUID (длинно)

Интервью: назовите trade-offs, не обязательно кодировать base62.

---

## Подзадачи

**Время:** ~60 мин.

### 17.1 API (15 мин)

3 метода + errors (not found).

### 17.2 Collision (20 мин)

Псевдокод hash retry loop.

### 17.3 Custom alias (15 мин)

`shorten(url, alias=None)` — validation.

### 17.4 SD bridge (10 мин)

Что уйдёт в Redis/HTTP layer?

---

## Чек-лист

- [ ] Repo abstracted?
- [ ] Collision strategy named?

**Дальше:** [18. UML и тесты](18-uml-testing.md).
