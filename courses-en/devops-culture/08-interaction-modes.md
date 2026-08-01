# 08. Team interaction modes

## Intro

Team Topologies defines **three modes** between teams. The wrong mode → bottlenecks: platform in **collaboration** for every sneeze, or streams **abandoned** without support.

---

## Three modes

| Mode | Essence | When |
|-------|------|-------|
| **Collaboration** | dense joint work | discovery, new product, crisis |
| **X-as-a-Service** | clear API, minimal sync meetings | platform ↔ streams (mature platform) |
| **Facilitating** | one team helps another grow | enabling → stream |

```text
        Collaboration (temporary, narrow focus)
              ↕
Stream ◄──► Platform  (X-as-a-Service — primary mode)
              ↕
        Facilitating (enabling team)
```

---

## Collaboration — carefully

**Plus:** fast learning, shared understanding.  
**Minus:** **one** team on **two** roads; WIP ↑; platform pulled into features.

**Rule:** timebox collaboration (6–8 weeks), explicit **exit goal** into X-as-a-Service.

---

## X-as-a-Service

Platform provides:

- `gitlab-ci` template with deploy to mockctl;
- Terraform module VPC;
- Grafana dashboard “paste your labels.”

Stream does **not wait** for platform on a call — reads docs, opens an MR in the module.

Platform metrics: time-to-first-successful-deploy, ticket rate, NPS of devs.

---

## Facilitating

Enabling runs:

- pairing on writing SLOs;
- NetworkPolicy workshop;
- review of postmortem process.

Does **not** take on-call for the stream.

---

## Choosing mode by maturity

| Platform maturity | Mode |
|-------------------|--------|
| Low (new IDP) | collaboration + facilitating |
| Medium | facilitating + growing X-as-a-Service |
| High | predominantly X-as-a-Service |

---

## Summary

Mode is a **conscious choice**, not “how it happened.” Platform by default is **X-as-a-Service**, not endless collaboration.

---

## Checklist

- [ ] How many weekly squad calls is platform mandatory on?
- [ ] Is there a published platform API/docs?
- [ ] Has the enabling team stated exit criteria?

**Next:** [09. Stream and platform in practice](09-stream-and-platform.md).
