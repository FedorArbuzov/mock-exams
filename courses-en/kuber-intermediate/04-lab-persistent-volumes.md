# 04. Lab: PVC, retention, expansion

The goal is to see the PVC/PV lifecycle by hand.

## Setup

```bash
kubectl create namespace lab-pv
kubectl config set-context --current --namespace=lab-pv
kubectl get sc                # the default should be 'standard'
```

## Task 1. Create a PVC

`pvc.yaml`:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: data
spec:
  accessModes: [ReadWriteOnce]
  resources:
    requests:
      storage: 200Mi
```

```bash
kubectl apply -f pvc.yaml
kubectl get pvc                # we expect Status: Bound
kubectl get pv | head
```

**What you'll see:** the PVC `data` became Bound, and a PV `pvc-<UID>` with capacity 200Mi appeared.

## Task 2. Write data

`writer.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: writer
spec:
  restartPolicy: Never
  containers:
    - name: w
      image: busybox
      command: ["sh", "-c", "date > /data/start.txt && sleep 3600"]
      volumeMounts:
        - name: d
          mountPath: /data
  volumes:
    - name: d
      persistentVolumeClaim:
        claimName: data
```

```bash
kubectl apply -f writer.yaml
kubectl exec writer -- cat /data/start.txt
```

## Task 3. Delete the pod, don't delete the PVC

```bash
kubectl delete pod writer
kubectl get pvc                # data is still Bound
```

Let's bring up a `reader` pod:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: reader
spec:
  restartPolicy: Never
  containers:
    - name: r
      image: busybox
      command: ["sh", "-c", "cat /data/start.txt && sleep 3600"]
      volumeMounts:
        - name: d
          mountPath: /data
  volumes:
    - name: d
      persistentVolumeClaim:
        claimName: data
```

```bash
kubectl apply -f reader.yaml
kubectl logs reader
```

**What you'll see:** the same date that the previous pod wrote. That's "persistence beyond the pod's lifetime".

## Task 4. StorageClass with reclaim=Retain

`sc-retain.yaml`:

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: keep
provisioner: k8s.io/minikube-hostpath
reclaimPolicy: Retain
volumeBindingMode: Immediate
```

`pvc-retain.yaml`:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: keep-data
spec:
  storageClassName: keep
  accessModes: [ReadWriteOnce]
  resources:
    requests:
      storage: 100Mi
```

```bash
kubectl apply -f sc-retain.yaml
kubectl apply -f pvc-retain.yaml
kubectl get pvc
kubectl get pv -o wide
```

Delete the PVC and **see what happens to the PV**:

```bash
PV=$(kubectl get pvc keep-data -o jsonpath='{.spec.volumeName}')
kubectl delete pvc keep-data
kubectl get pv "$PV"
```

**What you'll see:** the PV moved to `Released`, **not deleted**. On a real cloud, the data on the disk would remain.

Delete it by hand when you no longer need it:

```bash
kubectl delete pv "$PV"
```

## Task 5 (optional). PVC expansion

The minikube default StorageClass **supports** `allowVolumeExpansion`. Check:

```bash
kubectl get sc standard -o jsonpath='{.allowVolumeExpansion}'
```

If `true`, try:

```bash
kubectl patch pvc data -p '{"spec":{"resources":{"requests":{"storage":"500Mi"}}}}'
kubectl get pvc data
kubectl describe pvc data | head -30
```

**What should change:** capacity grows to 500Mi (on minikube hostpath this is a formality — the disk is really shared with the node; but you'll see an event about the change).

If `false`, skip the task; on real cloud classes this works transparently for the pod.

## Task 6. WaitForFirstConsumer

Create a StorageClass with `volumeBindingMode: WaitForFirstConsumer` and a PVC for it:

`sc-wait.yaml`:

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: wait-sc
provisioner: k8s.io/minikube-hostpath
volumeBindingMode: WaitForFirstConsumer
```

`pvc-wait.yaml`:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: wait-data
spec:
  storageClassName: wait-sc
  accessModes: [ReadWriteOnce]
  resources:
    requests:
      storage: 50Mi
```

```bash
kubectl apply -f sc-wait.yaml -f pvc-wait.yaml
kubectl get pvc wait-data
```

**What you'll see:** the PVC in `Pending` status with the message `waiting for first consumer to be created before binding`. There's no PV yet.

Create a pod:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: consumer
spec:
  restartPolicy: Never
  containers:
    - name: c
      image: busybox
      command: ["sh", "-c", "sleep 3600"]
      volumeMounts:
        - name: d
          mountPath: /data
  volumes:
    - name: d
      persistentVolumeClaim:
        claimName: wait-data
```

```bash
kubectl apply -f consumer.yaml
kubectl get pvc wait-data -w
```

**What you'll see:** now the PVC moves to `Bound`. The PV is created **once a consumer actually appears**.

## Cleanup

```bash
kubectl delete namespace lab-pv
kubectl delete sc keep wait-sc
kubectl config set-context --current --namespace=default
```

## Self-check questions

1. What happens to a PVC if you delete only the pod that uses it?
2. What's the practical difference between the `Delete` and `Retain` reclaim policies?
3. Why do you need `WaitForFirstConsumer`? What problem does it solve in multi-zone clusters?
4. Can a single PVC be used by two pods simultaneously in `ReadWriteOnce` mode?
5. How do you grow a PVC's size if the StorageClass supports it?
