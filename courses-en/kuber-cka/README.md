# Kubernetes CKA Lab (Kubespray)

Hands-on **cluster administrator** track: three Linux nodes, **Kubespray**, a real workload, then CKA-style tasks, troubleshooting, cluster operations, and a sequential **ON-CALL** run.

This is **not** a textbook and **not** Docker Desktop Kubernetes. You work on a live cluster. The lab engine prepares a known state, you fix or build something, **Check** grades the **result** (not your command history).

**Time:** ~40–55 hours including ON-CALL.  
**Prerequisites:** [`kuber-intermediate`](../kuber-intermediate/README.md) (you already use Deployments / Services / Ingress) and [`ansible-basic`](../ansible-basic/README.md). Helpful: [`linux-intermediate`](../linux-intermediate/README.md), [`kuber-bootstrap`](../kuber-bootstrap/README.md) if you want kubeadm-by-hand first.

> Setup: **[ENVIRONMENT.md](ENVIRONMENT.md)**. How Start / Check / modes work: **[00. How labs work](00-how-labs-work.md)**.

Open in the UI: **http://127.0.0.1:8091/kuber-cka/README.md**

---

## How to take this course

1. **ENVIRONMENT.md** once — three LXC nodes + Ansible + `kubectl` + `labctl`.
2. **Bootstrap 01–09** — you build the cluster. Those lessons are instructional.
3. From **CKA 01** onward the page is a **task**, not a walkthrough. Diagnose, change the cluster, press **Check**.
4. Labs are **sequential**. `python -m labctl status` shows `✓` / `→` / `🔒`.
5. After the main track: **ON-CALL 01–20** in order. **[Mock exam](99-mock-exam.md)** is a separate timed mode.

Modes (`LABCTL_MODE`):

| Mode | What you see |
|------|----------------|
| `training` | Hints on request (`python -m labctl hint`). Explanation after a pass. |
| `cka` | Task + score only. |
| `oncall` | Ticket text. Next incident unlocks only after this one passes. |

---

## Path

```text
Linux nodes
    ↓
Kubespray
    ↓
Kubernetes cluster
    ↓
CNI / CoreDNS / Ingress
    ↓
test application
    ↓
CKA labs
    ↓
troubleshooting labs
    ↓
cluster administration
    ↓
ON-CALL
    ↓
Course complete
```

---

## Local stand

```text
node-01   192.168.56.10   control-plane + etcd
node-02   192.168.56.11   worker
node-03   192.168.56.12   worker
node-04   192.168.56.13   added in CKA 26, removed in CKA 27
```

| Piece | Role |
|-------|------|
| LXC (or Vagrant) | Linux nodes |
| Kubespray + Ansible | install Kubernetes |
| containerd | CRI |
| Calico | CNI |
| CoreDNS | cluster DNS |
| ingress-nginx | Ingress (you choose how to install it) |
| `labctl` | prepare / verify / score / reset |

**RAM:** 16 GB on the machine that runs the three nodes (same idea as [`kuber-bootstrap` Path B](../kuber-bootstrap/ENVIRONMENT.md)).

---

## Curriculum

### How the engine works

0. [How labs work](00-how-labs-work.md)
1. [Why this path](01-why-this-path.md)

### Bootstrap (01–09)

10. [Bootstrap overview](10-bootstrap-overview.md)
11. [Lab: Linux nodes](11-lab-nodes.md)
12. [Lab: Kubespray inventory](12-lab-inventory.md)
13. [Lab: deploy Kubernetes](13-lab-deploy.md)
14. [Lab: validate control plane](14-lab-control-plane.md)
15. [Lab: validate etcd](15-lab-etcd.md)
16. [Lab: validate CNI](16-lab-cni.md)
17. [Lab: validate CoreDNS](17-lab-coredns.md)
18. [Lab: deploy the shop app](18-lab-app.md)
19. [Lab: validate Ingress](19-lab-ingress.md)

### CKA tasks (01–11)

20. [CKA track](20-cka-track.md)
21. [CKA 01 — Create a Pod](21-lab-cka-01-pod.md)
22. [CKA 02 — Deployment](22-lab-cka-02-deployment.md)
23. [CKA 03 — Rolling update](23-lab-cka-03-rollout.md)
24. [CKA 04 — Scheduling](24-lab-cka-04-scheduling.md)
25. [CKA 05 — Taints / tolerations](25-lab-cka-05-taints.md)
26. [CKA 06 — Service](26-lab-cka-06-service.md)
27. [CKA 07 — Ingress](27-lab-cka-07-ingress.md)
28. [CKA 08 — NetworkPolicy](28-lab-cka-08-networkpolicy.md)
29. [CKA 09 — ConfigMap](29-lab-cka-09-configmap.md)
30. [CKA 10 — Secret](30-lab-cka-10-secret.md)
31. [CKA 11 — PVC](31-lab-cka-11-pvc.md)

### Troubleshooting (12–25)

40. [Troubleshooting](40-troubleshooting.md)
41. [CKA 12 — Pod Pending](41-lab-cka-12-pending.md)
42. [CKA 13 — Node NotReady](42-lab-cka-13-notready.md)
43. [CKA 14 — Broken Service](43-lab-cka-14-service.md)
44. [CKA 15 — Broken DNS](44-lab-cka-15-dns.md)
45. [CKA 16 — No Internet egress](45-lab-cka-16-egress.md)
46. [CKA 17 — Ingress broken](46-lab-cka-17-ingress.md)
47. [CKA 18 — API Server timeout](47-lab-cka-18-apiserver.md)
48. [CKA 19 — etcd degradation](48-lab-cka-19-etcd.md)
49. [CKA 20 — OOMKilled](49-lab-cka-20-oom.md)
50. [CKA 21 — DiskPressure](50-lab-cka-21-diskpressure.md)
51. [CKA 22 — Scheduling failure](51-lab-cka-22-scheduling.md)
52. [CKA 23 — Cordon / drain](52-lab-cka-23-drain.md)
53. [CKA 24 — Broken CNI](53-lab-cka-24-cni.md)
54. [CKA 25 — Broken CoreDNS](54-lab-cka-25-coredns.md)

### Cluster administration (26–30)

60. [Cluster administration](60-admin.md)
61. [CKA 26 — Add a worker](61-lab-cka-26-add-worker.md)
62. [CKA 27 — Remove a worker](62-lab-cka-27-remove-worker.md)
63. [CKA 28 — Kubernetes upgrade](63-lab-cka-28-upgrade.md)
64. [CKA 29 — etcd backup](64-lab-cka-29-etcd-backup.md)
65. [CKA 30 — etcd restore](65-lab-cka-30-etcd-restore.md)

### ON-CALL (01–20)

70. [ON-CALL](70-oncall.md)
71. [ON-CALL 01](71-lab-oncall-01.md) … [ON-CALL 20](90-lab-oncall-20.md)

### Separate exam

99. [Final CKA mock](99-mock-exam.md) — not part of the sequential unlock chain

---

## What you should end up with

- You can install Kubernetes with Kubespray and explain what it put on the nodes.
- You can do CKA-shaped work without a recipe.
- You can walk a failure from `kubectl` down to kubelet, containerd, routes, and CNI.
- You can take a node out, add one, upgrade, and restore etcd.

## Related

| Course | Relation |
|--------|----------|
| [`kuber-bootstrap`](../kuber-bootstrap/README.md) | kubeadm **by hand** — do it if you want to see init before Ansible wraps it |
| [`mock-cka-kubeadm`](../mock-cka-kubeadm/README.md) | Timed drills on a kubeadm cluster |
| [`mock-cka`](../mock-cka/README.md) | API-only timed mock on Docker Desktop |
| [`kuber-troubleshoot`](../kuber-troubleshoot/README.md) | Break–fix on Docker Desktop (API only) |
| [`labctl`](../../labctl/README.md) | Engine used by this course |
