# 03. Persistent Volumes: PV / PVC / StorageClass

## Why

Containers are ephemeral: kill the pod and you lose everything on its filesystem. For data to survive a pod restart (let alone a node reboot), you need an **external** disk. In Kubernetes, three objects are responsible for this:

- **PersistentVolume (PV)** — an actual, existing disk (on a node, in the cloud, in a SAN). A separate, cluster-level object.
- **PersistentVolumeClaim (PVC)** — a "request" from a pod: "give me a 1 GB disk, ReadWriteOnce". An object inside a namespace.
- **StorageClass** — a description of "how and where to create new PVs" on demand (dynamic provisioning).

The flow is usually like this:

```text
Pod  →  PVC  →  StorageClass  →  (provisioner creates)  →  PV
```

## Static vs Dynamic provisioning

**Static.** An admin creates PVs in advance, users "claim" the size they need via a PVC, and k8s binds a suitable PV to the PVC. Manual labor, rarely used.

**Dynamic.** The PVC specifies a StorageClass; the provisioner (the plugin for that StorageClass) creates a PV of the required size **itself**. This is the default behavior in all modern clusters, including Docker Desktop Kubernetes.

Check what you have locally:

```bash
kubectl get sc
# NAME                 PROVISIONER              RECLAIMPOLICY   ...
# hostpath (default)   docker.io/hostpath       Delete          ...
# (names vary — use whatever is marked default)
```

If a PVC doesn't specify `storageClassName`, the default is used.

## Minimal PVC

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: data
spec:
  accessModes: [ReadWriteOnce]
  resources:
    requests:
      storage: 1Gi
```

After `kubectl apply`:

1. K8s sees a PVC without an explicit `storageClassName` → uses the default StorageClass.
2. That class’s provisioner creates a PV.
3. The PV and PVC are bound (`Bound`).
4. Any pod with `volumes[].persistentVolumeClaim.claimName: data` will get this disk.

## Access modes

`accessModes` specifies how the volume can be mounted:

- `ReadWriteOnce` (RWO) — a single node can mount it read/write. For local-storage and most cloud disks (EBS, GCE PD).
- `ReadOnlyMany` (ROX) — many nodes read-only.
- `ReadWriteMany` (RWX) — many nodes read/write. Only NFS/CephFS/EFS and the like.
- `ReadWriteOncePod` (RWOP, k8s 1.27+) — RW for **a single pod**, not a node.

On a typical local hostpath / local-path provisioner, only RWO is actually supported. That's fine for learning.

## Reclaim policy

A PV's `reclaimPolicy` determines what happens after the PVC is deleted:

- `Delete` — the provisioner deletes the actual disk. This is the default for most classes (including Docker Desktop’s default).
- `Retain` — the PV remains, the disk is left untouched. It can later be "reused" if you know how (manually mark it `Available`).
- `Recycle` — deprecated, don't use it.

To change the policy for specific PVCs, create a separate StorageClass with `reclaimPolicy: Retain`.

## Connection to pods

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: writer
spec:
  containers:
    - name: app
      image: busybox
      command: ["sh", "-c", "echo hello > /data/file && sleep 3600"]
      volumeMounts:
        - name: storage
          mountPath: /data
  volumes:
    - name: storage
      persistentVolumeClaim:
        claimName: data
```

Pod → mounts PVC `data` at `/data`. If the pod restarts, the disk reattaches and the file `/data/file` remains.

## Lifecycle — visually

```text
[nothing]
    │  kubectl apply -f pvc.yaml
    ▼
PVC: Pending
    │  provisioner created a PV
    ▼
PVC: Bound  ←→  PV: Bound
    │  pod uses the pvc, writes data
    ▼
PVC: Bound (data on disk)
    │  kubectl delete pod  → PVC alive
    ▼
PVC: Bound  (you can create a new pod and reattach)
    │  kubectl delete pvc
    ▼
if reclaim=Delete: PV deleted, disk deleted
if reclaim=Retain: PV remains in Released status
```

## StorageClass in more detail

A minimal example (set `provisioner` to the same value as your default SC — see [ENVIRONMENT.md](ENVIRONMENT.md)):

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: docker.io/hostpath   # REPLACE with: kubectl get sc … default provisioner
reclaimPolicy: Retain
volumeBindingMode: WaitForFirstConsumer
```

Fields:

- `provisioner` — who creates the PV (a plugin, like `kubernetes.io/aws-ebs`, `csi.driver.x`).
- `reclaimPolicy` — `Delete` or `Retain` (for new PVs).
- `volumeBindingMode`:
  - `Immediate` — create the PV as soon as the PVC appears.
  - `WaitForFirstConsumer` — wait until a pod that uses this PVC appears. Useful for cloud disks that are "tied" to a specific availability zone — then the disk is created in the same zone where the pod will be.
- `allowVolumeExpansion: true` — allows growing the PVC size after creation.
- `parameters: { ... }` — provisioner-specific parameters (disk type, IOPS, etc.).

## Resizing a PVC

If the StorageClass supports it (`allowVolumeExpansion: true`) and the provisioner can do it:

```bash
kubectl patch pvc data -p '{"spec":{"resources":{"requests":{"storage":"2Gi"}}}}'
```

The PV grows online. Most provisioners **cannot** shrink volumes.

## Useful commands

```bash
kubectl get pvc                       # PVCs in the current namespace
kubectl get pv                        # PVs (cluster-wide)
kubectl describe pvc data
kubectl get sc                        # StorageClasses
kubectl get pvc data -o yaml          # see the bound PV
kubectl get pv pvc-... -o yaml        # path on the node, size
```

It's handy to peek at the bound volume details (path on the node varies by provisioner):

```bash
kubectl get pv
kubectl get pv "$(kubectl get pvc data -o jsonpath='{.spec.volumeName}')" -o yaml
```

## Checklist

- How PV differs from PVC "in terms of level".
- What happens to a PVC on `kubectl delete pod`.
- What happens to a PV on `kubectl delete pvc` if reclaimPolicy = `Delete`. And if `Retain`?
- When you should choose `volumeBindingMode: WaitForFirstConsumer`.
- Why you need `accessModes: [ReadWriteOnce]` and why it's not enough for a "shared disk" between pods.

In the lab [04-lab-persistent-volumes.md](04-lab-persistent-volumes.md) we'll experiment with PVCs, policies, and expansion.
