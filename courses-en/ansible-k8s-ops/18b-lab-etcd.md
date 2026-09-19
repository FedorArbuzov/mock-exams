# 18b. Lab: etcd / control plane down

## Ticket

P1 — API dead

`kubectl` hangs. This stand has **one** etcd on `node-01`. That is a full outage, not “2 of 3 members left.” Do not add a second control plane (RAM). Do not `cluster.yml` again. Do not `etcdctl snapshot restore` — the datadir is still there.

Workers keep running **existing** pods. They cannot schedule new ones until the API is back.

## Task 1. Record

```bash
export KUBECONFIG=$HOME/.kube/nimbus-ops.conf
kubectl get nodes -o wide
kubectl get pods -A -o wide
ansible node-01 -b -m command -a 'ls /etc/kubernetes/manifests'
```

Pick one kube-system Pod that is already on `node-02` (Calico / kube-proxy). Write its name down.

## Task 2. Seed — disable the etcd static Pod

On `node-01` only. Do **not** `rm` `/var/lib/etcd`. Do **not** stop kubelet on workers.

```bash
ansible node-01 -b -m file -a 'path=/root/nimbus-disabled state=directory mode=0700'
ansible node-01 -b -m shell -a 'mv /etc/kubernetes/manifests/etcd.yaml /root/nimbus-disabled/etcd.yaml'
```

Wait ~30s. `kubectl --request-timeout=5s get nodes` should fail. On `node-02`:

```bash
ansible node-02 -b -m command -a 'crictl ps'
```

The pod you named should still have a container. That is the lesson.

`gather.yml` on `node-01` still fetches journals. The localhost `kubectl` dump may fail — set `failed_when: false` on that task (picture already does). Failure **is** evidence.

## Task 3. Close

`playbooks/runbooks/cp-health.yml`. Tags `runbook`. It may:

1. print kubelet state and `ls` manifests on `k8s_cp`
2. if `etcd.yaml` is in `/root/nimbus-disabled/` and missing from manifests — move it back
3. start kubelet if the unit is failed
4. wait until `kubectl get --raw=/readyz` works (localhost, `KUBECONFIG`)
5. **not** call Kubespray, **not** restore a snapshot, **not** `rm -rf /var/lib/etcd`

Author picture: [`examples/playbooks/runbooks/cp-health.yml`](examples/playbooks/runbooks/cp-health.yml).

```bash
ansible-playbook playbooks/runbooks/gather.yml --limit node-01
ansible-playbook playbooks/runbooks/cp-health.yml
ansible-playbook playbooks/runbooks/cp-health.yml
```

Second run is a no-op. `kubectl get nodes` — three Ready. Static pods on `node-01` are Running.

## Success criteria

- [ ] you saw the API die and a worker container stay up
- [ ] etcd came back from the **manifest**, not from `cluster.yml` or a snapshot
- [ ] `/var/lib/etcd` was not deleted
- [ ] you can say in one sentence why this stand is not HA etcd

Next: [19. Monday morning](19-monday.md).
