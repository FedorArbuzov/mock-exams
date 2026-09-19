# 01. Why two Ansible trees

Kubespray **is** Ansible. Teams still keep a second repository. This course is that second repository.

## The job story

Nimbus is going live on three empty Linux boxes. There is no cluster yet. You clone Kubespray, write inventory, run `cluster.yml`, then keep a second repo for everything the installer will not do. Nobody will pay you to rewrite `roles/kubernetes/control-plane`. They will pay you when:

- a contractor’s SSH key is still on the workers the Monday after the contract ends;
- a CVE lands on Saturday and workers must reboot **one at a time**;
- etcd snapshot exists but the PKI that can restore it does not;
- DiskPressure pages and the fix lives in someone’s scrollback.

That work is Ansible over SSH. It is not Helm. It is not “another `cluster.yml`.”

## Two trees

```text
~/kubespray/                 pinned checkout — you call playbooks
  cluster.yml
  scale.yml
  remove-node.yml
  inventory/lab/             membership + kube_version + CNI

~/nimbus-ops/                you write this
  inventory/hosts.yml        same three hosts, *your* groups
  roles/common
  roles/users
  roles/node-hygiene
  playbooks/preflight.yml
  playbooks/patch-workers.yml
  playbooks/backup-cluster.yml
  playbooks/node-labels.yml
  playbooks/runbooks/
  playbooks/audit.yml
```

| Question | Answer |
|----------|--------|
| Who installs kubelet, etcd, Calico? | Kubespray |
| Who adds `lena` and removes `contractor`? | `nimbus-ops` |
| Who upgrades Kubernetes one minor? | Kubespray `upgrade-cluster.yml` — **not this course** |
| Who applies glibc / reboot? | `nimbus-ops` `patch-workers.yml` |
| Who deploys the shop chart? | Not here. After bootstrap, that is GitOps or CI — [`helm-charts`](../helm-charts/15-ci-and-gitops.md) |

If you find yourself editing a file under `~/kubespray/roles/`, stop. Change `inventory/lab` `group_vars` or write a playbook in `nimbus-ops`.

## Skills you bring (not a stand)

[`ansible-basic`](../ansible-basic/README.md) taught inventory, roles, Vault, tags, `serial`, `block/rescue`. [`kuber-intermediate`](../kuber-intermediate/README.md) taught drain and kubelet on Docker Desktop. This course starts from **empty LXC** and wires those skills to a control plane **you** install.

## Checklist

- [ ] You can name two directories and what is allowed in each
- [ ] You will not claim “I wrote Kubespray”
- [ ] [ENVIRONMENT.md](ENVIRONMENT.md) RAM and kubeconfig name are read

Next: [02. Lab: nodes and an empty ops repo](02-lab-nodes.md).
