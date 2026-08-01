# Mock CKA 03 — solutions

## Q1

```bash
PROFILE="${MOCKCTL_PROFILE:-mock-exams}"
minikube -p "$PROFILE" ssh -- bash -c '
export ETCDCTL_API=3
export ETCDCTL_CACERT=/var/lib/minikube/certs/etcd/ca.crt
export ETCDCTL_CERT=/var/lib/minikube/certs/etcd/server.crt
export ETCDCTL_KEY=/var/lib/minikube/certs/etcd/server.key
export ETCDCTL_ENDPOINTS=https://127.0.0.1:2379
sudo -E etcdctl snapshot save /tmp/snap.db
'
minikube -p "$PROFILE" cp "$PROFILE:/tmp/snap.db" ~/cka-r3-etcd.db
ls -la ~/cka-r3-etcd.db
```

## Q2

```bash
cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: data-vol
  namespace: cka-m3
spec:
  accessModes: [ReadWriteOnce]
  resources:
    requests:
      storage: 1Gi
---
apiVersion: v1
kind: Pod
metadata:
  name: vol-writer
  namespace: cka-m3
spec:
  containers:
    - name: busybox
      image: busybox:1.36
      command: ["sh", "-c", "echo ok > /data/marker && sleep 3600"]
      volumeMounts:
        - name: data
          mountPath: /data
  volumes:
    - name: data
      persistentVolumeClaim:
        claimName: data-vol
EOF
```

## Q3

```bash
cat <<'EOF' | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-except-monitoring
  namespace: cka-m3-locked
spec:
  podSelector: {}
  policyTypes: [Ingress]
  ingress:
    - from:
        - namespaceSelector: {}
          podSelector:
            matchLabels:
              role: monitoring
    - from:
        - podSelector: {}
EOF
```

## Q4

```bash
kubectl -n cka-m3 patch service web-svc -p '{"spec":{"selector":{"app":"web"}}}'
kubectl -n cka-m3 get endpoints web-svc
```

## Q5

```bash
kubectl -n cka-m3 set env deployment/cfg-app --from=configmap/app-cfg --keys=MODE
kubectl -n cka-m3 rollout restart deployment/cfg-app
kubectl -n cka-m3 rollout status deployment/cfg-app
```

Or patch the image to nginx if busybox without env fails — env only is enough for Running.

## Q6

```bash
echo etcd > ~/cka-m3-q6.txt
```

## Q7

```bash
kubectl -n cka-m3 create serviceaccount viewer

cat <<'EOF' | kubectl apply -f -
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: cka-m3
rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: pod-viewer
  namespace: cka-m3
subjects:
  - kind: ServiceAccount
    name: viewer
    namespace: cka-m3
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
EOF

kubectl auth can-i create pods --as=system:serviceaccount:cka-m3:viewer -n cka-m3
kubectl auth can-i get pods --as=system:serviceaccount:cka-m3:viewer -n cka-m3
```
