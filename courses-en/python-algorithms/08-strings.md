# 08. Strings: hashing, anagram, palindrome

## Intro

Strings in Python are **immutable** — concatenation in a loop is O(n²); use `list` + `join`. Frequencies — `Counter`, anagrams — tuple(sorted(s)) or 26 counters.

---

## Anagrams

```python
def is_anagram(a: str, b: str) -> bool:
    return Counter(a) == Counter(b)
```

Grouping: `key = tuple(sorted(s))` or `tuple(Counter(s).items())`.

---

## Rolling hash (Rabin-Karp) — the idea

A sliding hash of a substring with O(1) update — for "find the pattern"; at the interview it's rarely written out in full, just know it **exists**.

---

## Palindrome

- Two pointers skipping non-alnum  
- **Expand around center** O(n²) for all subpalindromes  
- Manacher — overkill for an interview

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

## Subtasks

**Time:** ~70 min.

### 8.1 Group anagrams (15 min)

Already in ch09 — if you haven't done it, do it now.

### 8.2 Longest palindromic substring (25 min)

Expand around center — code.

### 8.3 Encode and decode strings (15 min)

`len#str` delimiter design.

### 8.4 Valid anagram + follow-up unicode (15 min)

Counter vs [26] array — when to use which?

---

## Checklist

- [ ] Not using `s +=` in a tight loop?
- [ ] Can you do expand center?

**Next:** [09. Hash map](09-hash-map.md).
