# Kubernetes Bootstrap (kubeadm + Ansible)

Hands-on **cluster install**: three Linux VMs, **kubeadm** init/join, CNI, etcd snapshot, drain, upgrade. **Ansible** does the node baseline and repeatable join — it does not replace kubeadm.

**Time:** ~10–14 hours + finale.  
**Prerequisites:** [`kuber-intermediate`](../kuber-intermediate/README.md) (you already use Deployments/Services) and [`ansible-basic`](../ansible-basic/README.md) (inventory, roles, `become`). Helpful: [`linux-intermediate`](../linux-intermediate/README.md) (systemd, sysctl).

> This is **not** Docker Desktop Kubernetes and **not** EKS. You build a control plane. Setup: **[ENVIRONMENT.md](ENVIRONMENT.md)**.

Open this course in the UI: **http://127.0.0.1:8091/kuber-bootstrap/README.md** (reading). Labs run on **Vagrant VMs**, not Interactive Check.

---

## How to take this course

1. **ENVIRONMENT.md** once — VirtualBox + Vagrant + Ansible (WSL2 on Windows).
2. **Read** the theory page.
3. **Do** the lab on the three VMs. Lesson 06 is `kubeadm init` **by hand**. Later labs wrap the same steps in roles.
4. There is **no** Interactive Check (the lab runner talks to Docker Desktop / LocalStack, not these VMs). Success criteria + [`scripts/verify.sh`](scripts/verify.sh).

Keep Docker Desktop Kubernetes **off** while the VMs run — RAM.

---

## Local stand

```text
cp   192.168.56.10   control-plane   ~2 GB RAM
w1   192.168.56.11   worker          ~1.5 GB
w2   192.168.56.12   worker          ~1.5 GB
```

| Piece | Role |
|-------|------|
| VirtualBox + Vagrant | three Ubuntu VMs |
| Ansible on the host (or WSL2) | inventory + roles |
| `kubectl` on the host | after you copy `admin.conf` from `cp` |

**RAM:** **10 GB** free is comfortable; **8 GB** works if you stop Docker Desktop k8s and other stacks.

You type the Vagrantfile, inventory, and roles in the labs. There is no checkout of `courses-en` on the student machine. [`examples/`](examples/README.md) is an author reference only.

---

## Curriculum

### Machines (01–04)

1. [Why self-hosted](01-why-self-hosted.md)
2. [Lab: three VMs and Ansible ping](02-lab-vms.md)
3. [Node baseline](03-node-baseline.md)
4. [Lab: containerd and kubeadm packages](04-lab-packages.md)

### Cluster (05–08)

5. [What kubeadm actually does](05-kubeadm-init.md)
6. [Lab: `kubeadm init` by hand](06-lab-init.md)
7. [CNI](07-cni.md)
8. [Lab: join workers, then wrap in Ansible](08-lab-join.md)

### Operate (09–12)

9. [etcd snapshot and restore](09-etcd.md)
10. [Lab: drain, uncordon, a third worker](10-lab-drain.md)
11. [Lab: kubeadm upgrade](11-lab-upgrade.md)
12. [Lab: break kubelet or CNI](12-lab-breakfix.md)

### Honesty and finale (13–15)

13. [What we skipped (HA, MetalLB, kubespray)](13-what-we-skipped.md)
14. [k3s in twenty minutes](14-k3s.md)
15. [Final project: from zero with `site.yml`](15-final-project.md)

---

## What you should end up with

- You can say on an interview: three-node **kubeadm**, Ansible for packages/sysctl, init/join, Flannel, etcd backup, drain, upgrade one worker at a time.
- You know Docker Desktop / kind is **not** that story.
- You know EKS is the **other** admin story ([`aws-advanced`](../aws-advanced/README.md) phase 3).
- You did **not** only run kubespray.

## Path

```text
kuber-basic → kuber-intermediate → ansible-basic
                    ↓
            kuber-bootstrap   ← you are here
                    ↓
            kuber-advanced (etcd/upgrade are no longer theory-only)
            mock-cka
```

## Related

| Course | Relation |
|--------|----------|
| [`ansible-basic`](../ansible-basic/README.md) | Inventory, roles — this course **uses** them |
| [`kuber-advanced`](../kuber-advanced/README.md) | Control plane internals on a cluster you already have |
| [`mock-cka`](../mock-cka/README.md) | Exam timing; kubeadm tasks still want a VM (this course) |
| [`bare-metal` 09](../bare-metal/09-kubernetes-on-bare-metal.md) | MetalLB, Talos — theory |
| [`aws-advanced`](../aws-advanced/README.md) 13–18 | Managed control plane (EKS), not kubeadm |
