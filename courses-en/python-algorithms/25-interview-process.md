# 25. The process: communication, edge cases, debugging

## Intro

A strong solution without voicing your thoughts risks a **no hire**. Structuring the 45 minutes is as important as the pattern.

---

## 45-min timeline

| Min | Action |
|-----|----------|
| 0–3 | Restate the problem in your own words |
| 3–8 | Examples, edge cases, brute idea |
| 8–12 | Optimal approach + complexity |
| 12–30 | Code (signature first, then the body) |
| 30–38 | Test: example + edge |
| 38–45 | Space optimization / follow-up |

---

## Edge cases checklist

- `[]`, `[1]`, all identical  
- Negative numbers  
- Duplicates  
- `None` for tree/list head  
- Off-by-one in slices  

---

## Communication

| Phrase | Why |
|-------|-------|
| "First O(n²), I'll improve to O(n) hash" | shows growth |
| "I'll check the empty array" | maturity |
| "The invariant here: window without repeats" | for the interviewer |

Silence >2 min is a red flag; talk, even while you're searching.

---

## Debugging without print-spam

1. Manually walk through the example from the statement  
2. One `print` in the middle of BS  
3. Simplify to a smaller n  

On CoderPad — put the test case in a comment.

---

## When you're stuck

1. Simplify (small-n brute)  
2. A different pattern from [04](04-pattern-recognition.md)  
3. Ask for a hint — better than staying silent for 15 min  

---

## Python style on the whiteboard

```python
def solve(nums: list[int]) -> int:
    if not nums:
        return 0
    ...
```

Names: `left`, `right`, `prefix`, not `i,j,k` everywhere without meaning.

---

## Subtasks

**Time:** ~60 min.

### 25.1 Mock script (20 min)

Write word for word the intro for the problem "Longest Substring Without Repeating".

### 25.2 Edge list (15 min)

A universal 10-item checklist — in mistakes.md.

### 25.3 Dry run (15 min)

Take your ch05/ch09 solution — walk through it on paper with pointers.

### 25.4 Hint recovery (10 min)

A medium problem: allow yourself a hint after 10 min — write down how you'd switch the pattern.

---

## Checklist

- [ ] Do you have a 45-min timeline?
- [ ] Is the edge checklist ready?

**Next:** [26. Synthesis](26-synthesis.md).
