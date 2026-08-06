# Kubernetes Intermediate

Intermediate level. It's assumed you've completed [`kuber-basic`](../kuber-basic/README.md): you can confidently create a Pod / Deployment / Service / Ingress and read `describe` and `logs`.

The goal of this course is to turn "I know the objects" into "I build production-ready applications and understand operations".

## Environment

See **[ENVIRONMENT.md](ENVIRONMENT.md)** (same Docker Desktop + courses UI path as basic). Short version:

1. [QUICKSTART.md](../../QUICKSTART.md) → http://127.0.0.1:8091/
2. `kubectl config use-context docker-desktop`
3. Helm on PATH; metrics-server and ingress-nginx when a lesson asks (commands in ENVIRONMENT.md)
4. NetworkPolicy labs (**11–12**) are **optional** on Docker Desktop (no Calico by default)

## Curriculum

### Storage

1. [StatefulSet and Headless Service](01-statefulset.md)
2. [Lab: StatefulSet + Postgres](02-lab-statefulset.md)
3. [Persistent Volumes: PV / PVC / StorageClass](03-persistent-volumes.md)
4. [Lab: PVC, retention, ReadWriteOnce](04-lab-persistent-volumes.md)

### Running tasks

5. [Job and CronJob](05-jobs.md)
6. [Lab: Job, CronJob, failure behavior](06-lab-jobs.md)

### Helm and reuse

7. [Helm: install, upgrade, values, templates](07-helm.md)
8. [Lab: package a demo application into a Helm chart](08-lab-helm.md)

> Deep chart authoring (helpers, dependencies, hooks, OCI, CI/GitOps): [`helm-charts`](../helm-charts/README.md).

### Access and networking

9. [RBAC: ServiceAccount, Role, RoleBinding](09-rbac.md)
10. [Lab: give a pod permission to read a ConfigMap](10-lab-rbac.md)
11. [NetworkPolicy](11-networkpolicy.md) *(optional without a policy CNI)*
12. [Lab: "lock down" a namespace except for one client](12-lab-networkpolicy.md) *(optional)*

### Application production-readiness

13. [Probes advanced: startupProbe, timings, behavior](13-probes-advanced.md)
14. [Lab: bring a "broken" application to Ready](14-lab-probes-advanced.md)
15. [Resources and QoS classes (Guaranteed/Burstable/BestEffort)](15-resources-qos.md)
16. [Lab: experiment with eviction](16-lab-resources-qos.md)
17. [HorizontalPodAutoscaler (HPA)](17-hpa.md)
18. [Lab: HPA by CPU](18-lab-hpa.md)
19. [PodDisruptionBudget, surge / unavailable, drain](19-pdb-and-rollouts.md)
20. [Lab: drain a node without downtime](20-lab-pdb-and-rollouts.md)
21. [Deployment strategies: blue-green and canary](21-deployment-strategies.md)
22. [Lab: blue-green cutover](22-lab-blue-green.md)
23. [Init and sidecar containers](23-init-and-sidecar.md)
24. [Lab: shared volume init→app, sidecar logger](24-lab-init-and-sidecar.md)

### Extending the API

25. [CustomResourceDefinition (CRD)](25-crd.md)
26. [Lab: your own `Tenant` CRD](26-lab-crd.md)

### Final project

27. [Mini-project: Postgres + API + Web + Ingress + HPA + RBAC](27-final-project.md)

## What you should end up with

- You can confidently answer "how do I deploy this application to k8s": state, configs, secrets, HPA, ingress, RBAC.
- You can read and write basic Helm charts (see [`helm-charts`](../helm-charts/README.md) for the full authoring track).
- You can explain QoS classes, the causes of OOMKilled and Evicted, what graceful shutdown and lifecycle hooks are.
- You understand NetworkPolicy (and when your CNI actually enforces it).
- You can cut traffic between blue and green Deployments with a Service selector switch (and explain when canary / RollingUpdate fit better).
- You can create a simple CRD and understand how to extend it with a controller.

## Next steps

- [`kuber-advanced`](../kuber-advanced/README.md) — for those heading into SRE / DevOps / Cluster-admin.
- [`mock-ckad`](../mock-ckad/README.md) — if your goal is to pass the CKAD certification.

## Structure of each lesson

Each lesson consists of two files:

- `NN-topic.md` — theory (10–20 min read).
- `NN-lab-topic.md` — a hands-on task (15–40 min), with hints and a reference solution at the end.
