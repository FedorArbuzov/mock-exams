# 04. How to recognize a problem's pattern

## Intro

The first **3–5 minutes** are for reading the statement and classifying it. The mistake: coding a brute force right away without understanding that it's "sliding window".

---

## Decision tree (simplified)

```text
Array/string, subarray/substring?
  ├─ sum/product fixed → prefix / sliding window
  ├─ pairs, palindrome, sorted → two pointers
  └─ frequency, "does it exist" → hash map

Search in sorted / answer is monotonic → binary search

Tree/graph → BFS/DFS

Optimum "take/don't take", counting paths → DP

Locally greedy choice → greedy (prove it!)

All permutations/combinations → backtracking
```

---

## Keywords in the statement

| Phrase | Pattern |
|-------|---------|
| "subarray with maximum sum" | Kadane / prefix |
| "k in a row" | sliding window |
| "without repeats" in a substring | window + set |
| "minimum of a sorted array" | rotated BS |
| "connected component" | graph DFS/BFS |
| "minimum number of coins" | DP unbounded knapsack |

---

## Clarifying questions (30 sec)

1. Size of n? Values (negative?)  
2. Empty input? A single element?  
3. Duplicates? Sorted?  
4. int overflow? (rare in Python)  
5. In-place or a new array?

---

## Brute → optimize

It's acceptable to say: "First an O(n²) all-pairs approach, then I'll improve it to O(n) with a hash map" — and then actually **make** the improvement.

---

## Subtasks

**Time:** ~55 min.

### 4.1 Classification (20 min)

10 problems by name (without solving) — name the pattern:

1. Longest Substring Without Repeating Characters  
2. Merge Intervals  
3. Number of Islands  
4. Coin Change  
5. Search in Rotated Sorted Array  
6. Daily Temperatures  
7. Word Search  
8. Kth Largest Element  
9. Subsets  
10. Trapping Rain Water  

### 4.2 Questions (10 min)

For problem 1, write 4 clarifying questions for the interviewer.

### 4.3 Brute sketch (15 min)

The "3Sum" problem — O(n³) in words; then hint at O(n²) (two pointers after sort).

### 4.4 Mistake (10 min)

Recall a problem where you picked the wrong pattern — record it in mistakes.md.

---

## Summary

Pattern before code. The decision tree and keywords are trained consciously, not by "having seen a lot" alone.

---

## Checklist

- [ ] Do you ask questions about n and edge cases?
- [ ] Can you name the pattern for 8/10 of the 4.1 problems?

**Next:** [05. Two pointers](05-two-pointers.md).
