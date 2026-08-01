# Linux — Advanced

Advanced level: **namespaces/cgroups**, **container runtime**, preparing a **Kubernetes node**, **audit/hardening**, **keepalived**, **sysctl/limits**, **eBPF (overview)**, runbooks and the capstone.

**Prerequisites:** [`linux-intermediate`](../linux-intermediate/README.md) — networking, firewall, sudo, systemd, nginx.

**Locally:** [`deploy/linux`](../../deploy/linux/README.md). For keepalived — the overlay [`docker-compose.advanced.yml`](../../deploy/linux/docker-compose.advanced.yml).

## How to read the chapters

Each lesson is a **book chapter**, not a cheat sheet:

1. **Theory** (01, 03, 05…) — a real-world scenario, concepts, examples on the stand, common mistakes, "in prod".
2. **Lab** (02-lab, 04-lab…) — goal, preparation, tasks with "what you'll see" / "if it doesn't work", success criteria.
3. Do the labs with the stand up: `cd deploy/linux && docker compose up -d`.

**Time:** ~50–70 minutes per "theory + lab" pair; the [capstone](28-final-project.md) — **3–5 hours**.

**Stand IPs:**

| Host | IP |
|------|-----|
| lab | 172.28.0.10 |
| srv1 | 172.28.0.11 |
| srv2 | 172.28.0.12 |
| web | 172.28.0.20 |
| dns | 172.28.0.53 |
| VIP (keepalived lab) | 172.28.0.100 |

SSH: **course** / **course**.

## Curriculum by phase

### Containers on Linux (01–06)

| # | Lesson |
|---|------|
| 01 | [namespaces](01-namespaces.md) |
| 02 | [Lab: unshare](02-lab-unshare.md) |
| 03 | [cgroups v2](03-cgroups.md) |
| 04 | [Lab: MemoryMax](04-lab-cgroups.md) |
| 05 | [containerd / CRI](05-containerd.md) |
| 06 | [Lab: ctr](06-lab-ctr.md) |

### Kubernetes node (07–08)

| 07 | [Preparing a K8s node](07-k8s-node-prep.md) |
| 08 | [Lab: verify-node.sh](08-lab-node-prep.md) |

### Security (09–14)

| 09–10 | auditd |
| 11–12 | hardening CIS-lite |
| 13–14 | fail2ban |

### HA and automation (15–18)

| 15–16 | keepalived VIP |
| 17 | iSCSI (theory) |
| 18 | Hooks for Ansible |

### Tuning and ops (19–24)

| 19–20 | sysctl, limits |
| 21–22 | eBPF intro |
| 23–24 | capacity, runbooks |

### Integration (25–28)

| 25–27 | docker socket, deploy user, integration |
| 28 | [Capstone](28-final-project.md) |

## What you should end up with

- You can explain how containers use the Linux kernel (namespaces + cgroups + runc).
- You apply hardening, audit and fail2ban on srv1.
- You prepare a worker node checklist for `mockctl up` / kubeadm.
- You write a runbook and assemble a production-like host in the capstone.

## Related courses

| Course | Link |
|------|-------|
| [`kuber-basic`](../kuber-basic/README.md) | containerd, CRI, crictl |
| [`kuber-advanced`](../kuber-advanced/README.md) | security, node ops |
| [`bare-metal`](../bare-metal/README.md) | iSCSI, hardware |
| [`gitlab-intermediate`](../gitlab-intermediate/README.md) | deploy user, CI SSH |
