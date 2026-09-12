# kuber-bootstrap examples

**Reference copies** of files you type in the labs. Lesson 02 does **not** copy this tree — create `~/kuber-bootstrap` yourself.

| Path | Role |
|------|------|
| [Vagrantfile](Vagrantfile) | `cp`, `w1`, `w2` on `192.168.56.10–12` |
| [ansible.cfg](ansible.cfg) | inventory path, no host-key prompt |
| [inventory/lab.ini](inventory/lab.ini) | groups + Vagrant SSH keys |
| [group_vars/k8s.yml](group_vars/k8s.yml) | k8s minor, Pod CIDR, advertise IP |
| [site.yml](site.yml) | common → control → workers |
| [roles/k8s_common](roles/k8s_common/tasks/main.yml) | swap, sysctl, containerd, kube* packages |
| [roles/k8s_control](roles/k8s_control/tasks/main.yml) | `kubeadm init` if `admin.conf` missing, then Flannel |
| [roles/k8s_worker](roles/k8s_worker/tasks/main.yml) | `kubeadm join` if kubelet.conf missing |
| [verify.sh](verify.sh) | three Ready nodes (`KUBECONFIG` required) |

**Lesson 06** is still a hand `kubeadm init` the first time. Roles are for rebuilds / finale.
