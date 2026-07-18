# 08. Строки: hashing, anagram, palindrome

## Введение

Строки в Python **immutable** — конкатенация в цикле O(n²); используйте `list` + `join`. Частоты — `Counter`, анаграммы — tuple(sorted(s)) или 26 счётчиков.

---

## Анаграммы

```python
def is_anagram(a: str, b: str) -> bool:
    return Counter(a) == Counter(b)
```

Группировка: `key = tuple(sorted(s))` или `tuple(Counter(s).items())`.

---

## Rolling hash (Rabin-Karp) — идея

Скользящий hash подстроки O(1) update — для «найти pattern»; на интервью редко пишут полностью, знайте **существование**.

---

## Palindrome

- Two pointers с пропуском не-alnum  
- **Expand around center** O(n²) все подпалиндромы  
- Manacher — overkill для интервью

---

## StringBuilder pattern

```python
parts: list[str] = []
for ch in s:
    if cond:
        parts.append(ch)
return "".join(parts)
```

---

## Подзадачи

**Время:** ~70 мин.

### 8.1 Group anagrams (15 мин)

Уже в ch09 — если не сделали, сделайте сейчас.

### 8.2 Longest palindromic substring (25 мин)

Expand around center — код.

### 8.3 Encode and decode strings (15 мин)

`len#str` delimiter design.

### 8.4 Valid anagram + follow-up unicode (15 мин)

Counter vs [26] array — когда что?

---

## Чек-лист

- [ ] Не используете `s +=` в tight loop?
- [ ] Expand center умеете?

**Дальше:** [09. Hash map](09-hash-map.md).
