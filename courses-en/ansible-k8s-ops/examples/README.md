# ansible-k8s-ops examples

**Reference copies** of files you type in `~/nimbus-ops`. Lessons do **not** copy this tree — create the repo yourself.

| Path | Role |
|------|------|
| [lxc-setup.sh](lxc-setup.sh) | three privileged LXC nodes + SSH |
| [ansible.cfg](ansible.cfg) | inventory path, no host-key prompt |
| [inventory/hosts.yml](inventory/hosts.yml) | `k8s_cp` / `k8s_workers` |
| [group_vars/all/users.yml](group_vars/all/users.yml) | `nimbus_users` list |
| [host_vars/](host_vars/node-02.yml) | labels |
| [site.yml](site.yml) | common + users + hygiene |
| [roles/common](roles/common/tasks/main.yml) | chrony, sshd, packages |
| [roles/users](roles/users/tasks/main.yml) | hire / fire |
| [roles/node-hygiene](roles/node-hygiene/tasks/main.yml) | journald + prune timer |
| [playbooks/](playbooks/preflight.yml) | preflight, patch, backup, labels, audit, runbooks |
| [kubespray/](kubespray/hosts.yaml) | sketch for `~/kubespray/inventory/lab` |
| [scripts/verify.sh](scripts/verify.sh) | finale checklist |

Kubespray itself is **not** vendored here. Clone `v2.27.0` to `~/kubespray`.

```bash
ansible-galaxy collection install -r collections/requirements.yml
```
