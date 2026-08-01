# 09. When you don't need a pattern

## Intro

"I applied 7 patterns" is an anti-hire. The interviewer is looking for **simplicity** and justification.

---

## OOD anti-patterns

| Anti-pattern | Problem |
|-------------|----------|
| God class | everything in `SystemManager` |
| Anemic domain | only getters/setters, logic in the service |
| Pattern fever | AbstractFactory for 2 cases |
| Premature microservices in OOD | 15 service classes |
| Inheritance 5 levels deep | fragility |

---

## YAGNI in the interview

Implement the **requirements now** + **one** extension point (interface).

"If there were 10 vehicle types, I'd introduce Strategy".

---

## Python idioms vs GoF

| GoF | Python often |
|-----|--------------|
| Strategy | callable / Protocol |
| Singleton | module |
| Decorator pattern | `@decorator` function |

---

## Sub-tasks

**Time:** ~45 min.

### 9.1 Refactor god (20 min)

Break a fictional `AppManager` into 3 classes.

### 9.2 Justify pattern (15 min)

For parking — is a Factory needed? Argue yes/no.

### 9.3 Anemic fix (10 min)

Move one rule into the entity.

---

## Checklist

- [ ] Can you decline a pattern?
- [ ] YAGNI phrase ready?

**Next:** [10. Parking Lot](10-parking-lot.md).
