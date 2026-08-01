# 03. DORA: four metrics and what they mean

## Intro

“We have 200 deploys a month” — the CEO is happy. “90% of them are hotfixes after the previous one” — engineers aren't. **DORA** (now part of Google Cloud / Accelerate research) gave **four key metrics** tied to **organizational** performance and stability.

---

## Four key metrics

| Metric | Question | Good trend |
|---------|--------|---------------|
| **Deployment frequency** | how often to prod? | more often (for your context) |
| **Lead time for changes** | commit → prod? | shorter |
| **Change failure rate** | % of changes → incident/hotfix? | lower |
| **Time to restore** | MTTR after failure? | shorter |

**Important:** “Elite / High / Medium / Low” are research **cohorts**; compare **yourself to yourself** over time, not to Netflix from a talk.

---

## Deployment frequency

| Context | “Good” looks like |
|----------|----------------------|
| SaaS web | once a day — once a week |
| Regulated bank | once a month **if** lead time and CFR are strong |
| Mobile app store | train releases, but **internal** environments — often |

Count: **successful** deploys to prod, not “pipeline runs.”

In mock-exams: frequent merges in [gitlab-intermediate](../gitlab-intermediate/README.md) → mockctl.

---

## Lead time for changes

Break it into segments:

```text
coding → review → CI → staging → approval → prod
```

The bottleneck is often **not** “docker build,” but **waiting 5 days for QA sign-off**.

**Work in progress** kills lead time harder than a slow test.

---

## Change failure rate

```text
CFR = (deploys that caused a prod failure) / (all deploys to prod)
```

Define **“failure”** up front: Sev2+ incident? hotfix within 24h? rollback?

High CFR with high frequency is a **signal** about test quality or architecture, not “too many deploys.”

---

## Time to restore (MTTR)

From **user impact** to **SLO restoration**, not from “the first ping in Slack.”

Related: [sre/07–09](../sre/07-alerting-on-call.md), [observability-basic](../observability-basic/README.md).

---

## The four metrics together

```text
         Deploy fast ──────────────────►
              │                    │
              │  Elite quadrant    │  “We move fast
              │  (often + reliable)│   and break rarely”
              ▼                    ▼
         Slow ◄────────────────── Break often
```

Optimizing **one** metric in isolation is harmful: frequency ↑ without CFR ↓ — chaos.

---

## Summary

DORA is a **language** between engineering and the business. Without definitions of “deploy” and “failure,” the numbers are meaningless.

---

## Checklist

- [ ] Can you compute lead time for the last MR?
- [ ] What counts as a change failure for you?
- [ ] Is MTTR counted from impact or from the ticket?

**Next:** [04. DORA capabilities](04-dora-capabilities.md).
