# Mock CKA — Run 02

**Level:** medium. **Time:** 120 minutes. **CKA domain:** scheduling, maintenance, troubleshooting.

Related: [kuber-advanced/05–07](../kuber-advanced/05-scheduling-taints.md).

## Preparation

```bash
mockctl up
bash courses/mock-cka/02/prepare.sh
```

The first node will have the taint `cka-m2=true:NoSchedule`. The deployment `needs-toleration` will stay Pending without a toleration. `probe-fail` has an incorrect liveness probe.

## Tasks

### Q1. Taint and toleration

Make the deployment `needs-toleration` in `cka-m2` become **Running** (add a toleration for the taint `cka-m2=true:NoSchedule`).

### Q2. nodeSelector

1. Label **one** node with `disktype=ssd` (you may override `hdd` — overwrite it).
2. Create a Pod `ssd-pod` in `cka-m2`:
   - image `nginx:1.27-alpine`;
   - `nodeSelector`: `disktype: ssd`.

### Q3. Pod anti-affinity

Create a deployment `spread` in `cka-m2`:

- image `nginx:1.27-alpine`;
- **3** replicas;
- pod label: `app=spread`;
- **required** pod anti-affinity: do not place on the same node as another pod with label `app=spread` (topologyKey `kubernetes.io/hostname`).

On a single node only 1 pod will be Running — this is normal for minikube; on the exam there are usually 2+ nodes.

### Q4. Cordon

1. Run `kubectl cordon` on the **first** node of the cluster.
2. Write a single word to the file `~/cka-m2-q4.txt`: `cordoned` (in Latin letters, no quotes).

### Q5. Fix probes

Fix the deployment `probe-fail` in `cka-m2`: the liveness probe should check port **80**, path `/`. The pod should become Ready.

### Q6. PriorityClass

1. Create a PriorityClass `high-work` with value `1000000` (do not change the global default).
2. Create a Pod `urgent` in `cka-m2` with this priorityClass, image `nginx:1.27-alpine`.

### Q7. Uncordon

Uncordon the same node (`kubectl uncordon`) so the cluster accepts new pods again.

## Verification

```bash
bash courses/mock-cka/02/verify.sh
```

## Cleanup

```bash
NODE=$(kubectl get nodes -o jsonpath='{.items[0].metadata.name}')
kubectl taint node "$NODE" cka-m2=true:NoSchedule- 2>/dev/null || true
kubectl uncordon "$NODE" 2>/dev/null || true
kubectl delete ns cka-m2
rm -f ~/cka-m2-q4.txt
```

## After your attempt

[`solution.md`](solution.md)
