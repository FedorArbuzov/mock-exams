# 15. Final project: from zero with `site.yml`

Destroy the lab VMs and rebuild **only** with Vagrant + Ansible. Init and Flannel may live in the `k8s_control` role (`creates: /etc/kubernetes/admin.conf`), not a hidden manual session — you already did hand-init in lesson 06.

## Story

Nimbus wants a **dev** Kubernetes they can wipe: three nodes, Flannel, nginx Deployment, documented etcd snapshot command.

## Stand

[ENVIRONMENT.md](ENVIRONMENT.md). Folder `~/kuber-bootstrap`.

```bash
cd ~/kuber-bootstrap
vagrant destroy -f
vagrant up
ansible all -m ping
ansible-playbook site.yml
```

Copy kubeconfig as in lesson 06. Flannel is in the `k8s_control` role; if you wrote your own role without it, apply the manifest from lesson 08.

## Requirements

| # | Criterion |
|---|-----------|
| 1 | Inventory groups `k8s_cp` / `k8s_workers`, IPs 192.168.56.10–12 |
| 2 | Role `k8s_common` on all (swap, sysctl, containerd, pinned kube* packages) |
| 3 | `kubeadm init` with advertise **192.168.56.10** and Pod CIDR **10.244.0.0/16** |
| 4 | Two workers joined; three `Ready` |
| 5 | Flannel Running |
| 6 | `kubectl create deployment finale --image=nginx:1.27 --replicas=2` — Pods Running |
| 7 | README: how to snapshot etcd (commands you actually ran in 09) |
| 8 | `vagrant destroy -f` at the end **or** `vagrant halt` if you keep the lab |

Bonus: `serial: 1` drain playbook from lesson 11 in `playbooks/drain-upgrade.yml` (even if you do not bump the version again).

## Verification

```bash
cd ~/kuber-bootstrap
export KUBECONFIG=$HOME/.kube/kuber-bootstrap.conf
bash verify.sh
```

### Rubric

- [ ] Someone else can `vagrant up` + `ansible-playbook site.yml` from README
- [ ] You can explain init vs join vs CNI without opening kubespray
- [ ] You did **not** skip lesson 06 (hand init) when you first took the course

## Demo script (5 min)

1. `kubectl get nodes -o wide`
2. `vagrant ssh cp -- sudo ls /etc/kubernetes/manifests`
3. One sentence: advertise-address
4. `verify.sh`

## After this course

- [`kuber-advanced`](../kuber-advanced/README.md) phase 1 — scheduling, Velero; etcd is no longer abstract
- [`mock-cka`](../mock-cka/README.md) — then a kubeadm VM (killer.sh) for exam-shaped etcd
- [`aws-advanced`](../aws-advanced/README.md) — EKS if that is the job
