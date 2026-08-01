# 17. URL Shortener (OOD slice)

## Intro

The full design is system design; in OOD it's **encode/decode**, a storage interface, and collisions.

[api-design](../api-design/README.md), [redis](../redis/README.md) for scale.

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
- UUID (long)

Interview: name the trade-offs, you don't have to code base62.

---

## Sub-tasks

**Time:** ~60 min.

### 17.1 API (15 min)

3 methods + errors (not found).

### 17.2 Collision (20 min)

Pseudocode for a hash retry loop.

### 17.3 Custom alias (15 min)

`shorten(url, alias=None)` — validation.

### 17.4 SD bridge (10 min)

What moves into the Redis/HTTP layer?

---

## Checklist

- [ ] Repo abstracted?
- [ ] Collision strategy named?

**Next:** [18. UML and tests](18-uml-testing.md).
