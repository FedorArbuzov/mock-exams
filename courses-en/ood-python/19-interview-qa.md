# 19. Common interviewer questions

## Intro

After the design come **deep-dive** questions. Prepare short answers with a trade-off.

---

## Process and principles

| Question | Angle of the answer |
|--------|-------------|
| Why not inheritance? | composition, LSP |
| How to add a new type? | OCP, registry |
| How to test? | DI, fakes |
| Thread-safe? | locks, immutable VO |
| Persist? | Repository swap |

---

## Patterns

| Question | Answer |
|--------|-------|
| Strategy vs State | intent: interchangeable alg vs internal transitions |
| Singleton? | module/DI, tests |
| Factory vs Builder | simple vs multi-step construct |

---

## Python-specific

| Question | Answer |
|--------|-------|
| ABC vs Protocol | nominal vs structural |
| dataclass entity | frozen for VO |
| `__slots__` | memory, when it's appropriate |

[python-deep-dive](../python-deep-dive/README.md).

---

## Sub-tasks

**Time:** ~50 min.

### 19.1 Flash cards (25 min)

10 Q&A — a 2-sentence answer each.

### 19.2 Weak spots (15 min)

3 topics from the self-check — reread the chapters.

### 19.3 Mock answer (10 min)

Record a voice answer for "how to make a thread-safe LRU".

---

## Checklist

- [ ] 10 Q&A ready?
- [ ] Python vs Java OOD differences?

**Next:** [20. Synthesis](20-synthesis.md).
