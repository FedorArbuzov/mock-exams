# 04. Lab: install the cluster

Install Kubernetes with Kubespray on the three empty nodes from [lesson 02](02-lab-nodes.md). First run takes a while (images, debs). Do **not** skip `cluster.yml`.

## Task 1. Clone and venv

```bash
git clone --branch v2.27.0 --depth 1 https://github.com/kubernetes-sigs/kubespray.git ~/kubespray
cd ~/kubespray
python3 -m venv venv
source venv/bin/activate
pip install -U pip
pip install -r requirements.txt
```

Stay in that venv for every Kubespray playbook.

## Task 2. Inventory `lab`

```bash
cp -r ~/kubespray/inventory/sample ~/kubespray/inventory/lab
```

Edit `inventory/lab/hosts.yaml` (name may be `inventory.ini` in older docs — v2.27 uses YAML). Hosts `node-01` / `node-02` / `node-03`, IPs `192.168.56.10–12`. Groups as in [lesson 03](03-kubespray.md).

In the `k8s_cluster` `group_vars` for this release:

- `kube_version: v1.31.4` (or another 1.31.x the tag supports)
- `container_manager: containerd`
- `kube_network_plugin: calico`

Sketch: [`examples/kubespray/hosts.yaml`](examples/kubespray/hosts.yaml) and [`examples/kubespray/k8s-cluster.yml`](examples/kubespray/k8s-cluster.yml). Adjust filenames to what v2.27.0 actually created.

```bash
cd ~/kubespray
source venv/bin/activate
ansible -i inventory/lab/hosts.yaml all -m ping
```

Three `pong` **with the venv Ansible**.

## Task 3. `cluster.yml`

```bash
cd ~/kubespray
source venv/bin/activate
ansible-playbook -i inventory/lab/hosts.yaml cluster.yml -b
```

When it finishes:

```bash
mkdir -p ~/.kube
cp ~/kubespray/inventory/lab/artifacts/admin.conf ~/.kube/nimbus-ops.conf
export KUBECONFIG=$HOME/.kube/nimbus-ops.conf
kubectl get nodes -o wide
kubectl get pods -A
```

Three nodes, control plane Ready. Workers become Ready when Calico is up — wait, do not “fix” CNI with Helm.

Do not point `KUBECONFIG` at Docker Desktop.

## Task 4. Proof you looked at the disk

On `node-01` (SSH or `ansible node-01 -b -m command -a 'ls …'`):

- list `/etc/kubernetes/manifests`
- list `/etc/kubernetes/pki` (names only — do not copy PEMs into git)
- `systemctl is-active kubelet` on all three

Write the three paths into `~/nimbus-ops/README.md`.

## Success criteria

- [ ] Kubespray v2.27.0 in `~/kubespray` with a venv
- [ ] `inventory/lab` has the three hosts and pinned 1.31 / containerd / Calico
- [ ] `kubectl get nodes` — three **Ready** using `nimbus-ops.conf`
- [ ] README names manifests, pki, kubelet

Next: [05. Baseline](05-baseline.md).
