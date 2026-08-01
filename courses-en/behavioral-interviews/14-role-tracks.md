# 14. Backend, DevOps, SRE: story emphasis

## Intro

One story bank — different **emphasis** in the delivery. Backend gets asked about product and APIs; DevOps — about delivery and incidents; SRE — about SLOs and blameless.

---

## Backend / fullstack Python

| Competency | Example story |
|-------------|----------------|
| Quality | contract tests, [fastapi/32](../fastapi/32-contract-tests.md) |
| Performance | N+1, caching |
| Collaboration | an API with frontend/mobile |
| Ownership | a feature from idea to prod |

Courses: [fastapi](../fastapi/README.md), [django](../django/README.md), [python-testing](../python-testing/README.md).

---

## DevOps / platform

| Competency | Example |
|-------------|--------|
| Automation | pipeline, GitOps |
| Reliability | mockctl deploy, rollback |
| Security | secrets, SAST in MR |
| Cost | finops-aware change |

Courses: [gitlab-advanced](../gitlab-advanced/README.md), [gitops-*](../gitops-basic/README.md), [kuber-*](../kuber-basic/README.md).

---

## SRE

| Competency | Example |
|-------------|--------|
| SLO | error budget policy |
| Incident | commander role, comms |
| Toil reduction | automation |
| Postmortem | [sre/09](../sre/09-postmortems.md) |

---

## Subtasks

**Time:** ~50 min.

### 14.1 Role (5 min)

Your target track.

### 14.2 Top 5 competencies (15 min)

For this role — the priority from [04](04-competencies.md).

### 14.3 Repackaging (20 min)

2 stories from the bank — emphasis for DevOps vs backend.

### 14.4 Technical tie-in (10 min)

One phrase "from a mock-exams course I applied X at work".

---

## Checklist

- [ ] Are the stories relevant to the JD?
- [ ] No DevOps stories on pure backend without a connection?

**Next:** [15. Reverse questions](15-reverse-questions.md).
