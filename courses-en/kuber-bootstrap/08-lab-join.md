# 08. Lab: join workers, then wrap in Ansible

## Task 1. CNI on the live cluster

From the laptop (`KUBECONFIG` from lesson 06):

```bash
kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml
kubectl get nodes
kubectl get pods -A
```

`cp` should become `Ready`. CoreDNS Running.

## Task 2. Join by hand (at least w1)

On `cp`:

```bash
sudo kubeadm token create --print-join-command
```

On `w1` (and then `w2`):

```bash
sudo kubeadm join 192.168.56.10:6443 --token ... --discovery-token-ca-cert-hash sha256:...
```

```bash
kubectl get nodes
```

Three `Ready`. If `Unauthorized` or expired token — create a new token, do not reuse a screenshot from last week.

## Task 3. Encode it (role `k8s_worker`)

Now it is allowed to be Ansible. Pattern:

- On `cp`: `kubeadm token create --print-join-command` (`register`, `run_once`, `delegate_to` the cp host).
- On workers: `command: "{{ join_cmd.stdout }}"` with `creates: /etc/kubernetes/kubelet.conf`.

Role `k8s_control` for a **reinstall** can run `kubeadm init` with `creates: /etc/kubernetes/admin.conf` — you already did init by hand; the role is for lesson 15 from-scratch.

`site.yml` becomes:

```yaml
- hosts: k8s
  become: true
  roles: [k8s_common]

- hosts: k8s_cp
  become: true
  roles: [k8s_control]   # skip if admin.conf already exists

- hosts: k8s_workers
  become: true
  roles: [k8s_worker]
```

Apply against **already joined** workers: join task should be skip/`ok`.

## Task 4. Smoke

```bash
kubectl run net --image=busybox:1.36 --restart=Never -- sleep 3600
kubectl exec net -- ping -c 2 kubernetes
```

## Success criteria

- [ ] Three nodes Ready
- [ ] Flannel DaemonSet Ready
- [ ] You joined **at least one** worker without Ansible
- [ ] Worker role is idempotent on a second playbook run

Next: [09. etcd](09-etcd.md).
