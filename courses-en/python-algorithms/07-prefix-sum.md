# 07. Prefix sum and difference array

## Intro

Many "sum over the range [l,r]" queries — prefixes give O(1) per query. A **difference array** gives O(1) range updates.

---

## Prefix sum

```python
def build_prefix(nums: list[int]) -> list[int]:
    pref = [0]
    for x in nums:
        pref.append(pref[-1] + x)
    return pref

def range_sum(pref: list[int], l: int, r: int) -> int:  # inclusive l,r
    return pref[r + 1] - pref[l]
```

`itertools.accumulate` — the same with `initial=0`.

---

## Subarray sum equals k (hash + prefix)

```python
count = 0
pref = 0
freq: dict[int, int] = defaultdict(int)
freq[0] = 1
for x in nums:
    pref += x
    count += freq[pref - k]
    freq[pref] += 1
```

---

## 2D prefix (matrix)

`pref[i+1][j+1] = sum rect` — for submatrices; rarer at a middle interview.

---

## Difference array

```python
def range_add(diff: list[int], l: int, r: int, val: int) -> None:
    diff[l] += val
    if r + 1 < len(diff):
        diff[r + 1] -= val
# reconstruction: running sum over diff
```

---

## Subtasks

**Time:** ~65 min.

### 7.1 Range sum queries (15 min)

Prefixes + 5 queries on paper.

### 7.2 Subarray sum equals k (25 min)

Full code in Python.

### 7.3 Product of array except self (15 min)

Prefix/suffix without division — O(n).

### 7.4 Difference (10 min)

An array of zeros, 3 range-add operations — reconstruct the result.

---

## Checklist

- [ ] prefix[i] = sum(nums[:i])?
- [ ] Subarray sum k without O(n²)?

**Next:** [08. Strings](08-strings.md).
