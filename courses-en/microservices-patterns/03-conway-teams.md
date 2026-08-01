# 03. Conway and team topology

## Intro

Five teams and three microservices with a shared DB — the architecture mirrored the **org structure**: everyone hits the same schema because "it's easier that way." **Conway's law** and **Team Topologies** connect code boundaries with responsibility boundaries.

---

## Conway's law

> Organizations design systems that copy the organization's communication structure.

| Org structure | The "default" architecture |
|--------------|----------------------------|
| Front / back / DBA | a layered monolith |
| By feature (teams A, B) | services by feature (if given autonomy) |
| "Shared integrations department" | ESB, god service |

**Reverse Conway:** design the **desired** team topology → then the service boundaries ([devops-culture/06](../devops-culture/06-reverse-conway.md)).

---

## Team Topologies (4 types)

| Type | Role |
|-----|------|
| **Stream-aligned** | a value stream (product, domain) |
| **Platform** | self-service infra (K8s, CI, observability) |
| **Enabling** | temporarily helps adopt a practice |
| **Complicated-subsystem** | ML, billing engine — rare deep expertise |

Every **microservice** (or a group of closely related ones) should have an **explicit owner** — a stream-aligned team.

---

## Two-pizza team and cognitive load

| Rule | Practice |
|---------|----------|
| Own 2–3 services max | otherwise on-call hell |
| On-call on the service owner | not a "shared backend on-call" |
| Platform removes toil | don't force the stream team to write Helm from scratch |

---

## Interaction modes

| Mode | When |
|-------|-------|
| **Collaboration** | discovery, a new product |
| **X-as-a-Service** | a stable platform API |
| **Facilitating** | enabling helps a stream |

Microservices between stream teams → an **X-as-a-Service** contract (versioned API/events), not endless calls.

---

## Ownership and "shared" services

| Bad | Better |
|-------|-------|
| A "shared" Auth with no owner | Platform identity or a dedicated team |
| Everyone patches logging | Platform observability |
| A "everyone fixes everything" rotation | runbook + a domain owner |

---

## In mock-exams

| Topic | Course |
|------|------|
| Conway, Topologies | [devops-culture/05–08](../devops-culture/05-conway-law.md) |
| Platform thinking | [devops-culture/09](../devops-culture/09-stream-and-platform.md) |
| SRE org | [sre/13](../sre/13-organizing-sre.md) |

---

## Subtasks

**Time:** ~45–55 min.

### 3.1 Current map (15 min)

For the product from ch.01: how many teams? Who deploys what? Who is on-call? A team × service/module table.

### 3.2 Conway diagnosis (10 min)

One architecture problem that **reflects** the current org structure (example: "a shared DB because there's one DBA team").

### 3.3 Target topology (15 min)

Assign stream-aligned teams to the bounded contexts from ch.02. Specify one platform and one enabling team (if needed).

### 3.4 Interaction mode (10 min)

For the "Orders → Payment" relationship, pick a mode and describe the **contract** (sync API vs event + response SLA).

### 3.5 On-call (5 min)

Who is on-call for Payment in the target model? What escalates to platform?

---

## Summary

A microservice with no owning team → an **abandoned** service. Reverse Conway: teams and interaction modes first, then repositories.

---

## Checklist

- [ ] Does every context have a stream-aligned owner?
- [ ] Platform doesn't duplicate business logic?
- [ ] On-call tied to the service?

**Next:** [04. Strangler Fig and incremental extraction](04-strangler-extraction.md).
