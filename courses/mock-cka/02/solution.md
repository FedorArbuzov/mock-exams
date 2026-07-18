# Mock CKA 02 — решения

## Q1

```bash
kubectl -n cka-m2 patch deployment needs-toleration --type=json -p='[
  {"op":"add","path":"/spec/template/spec/tolerations","value":[
    {"key":"cka-m2","operator":"Equal","value":"true","effect":"NoSchedule"}
  ]}
]'
kubectl -n cka-m2 rollout status deployment/needs-toleration
```

## Q2

```bash
NODE=$(kubectl get nodes -o jsonpath='{.items[0].metadata.name}')
kubectl label node "$NODE" disktype=ssd --overwrite

cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: ssd-pod
  namespace: cka-m2
spec:
  nodeSelector:
    disktype: ssd
  containers:
    - name: nginx
      image: nginx:1.27-alpine
EOF
```

## Q3

```bash
cat <<'EOF' | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spread
  namespace: cka-m2
spec:
  replicas: 3
  selector:
    matchLabels:
      app: spread
  template:
    metadata:
      labels:
        app: spread
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchLabels:
                  app: spread
              topologyKey: kubernetes.io/hostname
      containers:
        - name: nginx
          image: nginx:1.27-alpine
EOF
```

## Q4

```bash
NODE=$(kubectl get nodes -o jsonpath='{.items[0].metadata.name}')
kubectl cordon "$NODE"
echo cordoned > ~/cka-m2-q4.txt
```

## Q5

```bash
kubectl -n cka-m2 patch deployment probe-fail --type=json -p='[
  {"op":"replace","path":"/spec/template/spec/containers/0/livenessProbe","value":{
    "httpGet":{"path":"/","port":80},"initialDelaySeconds":3,"periodSeconds":10
  }}
]'
```

## Q6

```bash
cat <<'EOF' | kubectl apply -f -
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: high-work
value: 1000000
globalDefault: false
EOF

kubectl -n cka-m2 run urgent --image=nginx:1.27-alpine --overrides='
{"spec":{"priorityClassName":"high-work"}}'
```

## Q7

```bash
kubectl uncordon "$(kubectl get nodes -o jsonpath='{.items[0].metadata.name}')"
```
