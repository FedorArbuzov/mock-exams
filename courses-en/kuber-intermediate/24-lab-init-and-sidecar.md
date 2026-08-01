# 24. Lab: init container + sidecar

## Setup

```bash
kubectl create namespace lab-init
kubectl config set-context --current --namespace=lab-init
```

## Task 1. Init container

`web-init.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata: { name: web-init }
spec:
  restartPolicy: Never
  initContainers:
    - name: setup
      image: busybox
      command: ["sh", "-c", "echo '<h1>hello $(date)</h1>' > /work/index.html && sleep 5"]
      volumeMounts:
        - name: html
          mountPath: /work
  containers:
    - name: nginx
      image: nginx:1.27-alpine
      ports: [{ containerPort: 80 }]
      volumeMounts:
        - name: html
          mountPath: /usr/share/nginx/html
  volumes:
    - name: html
      emptyDir: {}
```

```bash
kubectl apply -f web-init.yaml
kubectl get pod web-init -w
```

**What you'll see:**

```text
web-init   0/1   Init:0/1   0     5s
web-init   0/1   PodInitializing   0   8s
web-init   1/1   Running    0     10s
```

`Init:0/1` — the phase "the first of 1 init containers is running". After the init container finishes, it transitions to the main one.

Let's check the page:

```bash
kubectl port-forward web-init 8080:80 &
sleep 2
curl -s http://localhost:8080
kill %1
```

It should be `<h1>hello ...</h1>`.

## Task 2. Init failed — what next

`init-fail.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata: { name: init-fail }
spec:
  restartPolicy: Always
  initContainers:
    - name: bad
      image: busybox
      command: ["sh", "-c", "echo failing; exit 1"]
  containers:
    - name: nginx
      image: nginx:1.27-alpine
```

```bash
kubectl apply -f init-fail.yaml
kubectl get pod init-fail -w
```

**What you'll see:** `Init:CrashLoopBackOff` — the kubelet tries to run the init container over and over. The main nginx doesn't start.

```bash
kubectl logs init-fail -c bad
```

## Task 3. Sidecar for logs (classic)

`web-sidecar.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata: { name: web-sidecar }
spec:
  restartPolicy: Never
  containers:
    - name: nginx
      image: nginx:1.27-alpine
      ports: [{ containerPort: 80 }]
      volumeMounts:
        - name: logs
          mountPath: /var/log/nginx
    - name: log-tailer
      image: busybox
      command: ["sh", "-c", "echo 'tailer started'; tail -F /var/log/nginx/access.log"]
      volumeMounts:
        - name: logs
          mountPath: /var/log/nginx
  volumes:
    - name: logs
      emptyDir: {}
```

```bash
kubectl apply -f web-sidecar.yaml
kubectl wait --for=condition=ready pod/web-sidecar
kubectl get pod web-sidecar
```

**What you'll see:** `READY 2/2` — two containers in one pod.

```bash
kubectl logs web-sidecar -c log-tailer
```

Right now the log is empty (nobody has hit nginx yet). Let's poke nginx:

```bash
kubectl exec web-sidecar -c nginx -- wget -qO- http://localhost > /dev/null
sleep 1
kubectl logs web-sidecar -c log-tailer
```

**What you'll see:** nginx's access log appeared in the sidecar's output.

## Task 4. Native sidecar (k8s 1.29+)

Only if you have k8s 1.29 or higher. Check:

```bash
kubectl version | grep "Server Version"
```

If 1.29+, let's try:

`web-native.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata: { name: web-native }
spec:
  initContainers:
    - name: log-tailer
      image: busybox
      restartPolicy: Always
      command: ["sh", "-c", "echo native-sidecar started; sleep 99999"]
  containers:
    - name: nginx
      image: nginx:1.27-alpine
```

```bash
kubectl apply -f web-native.yaml
kubectl get pod web-native
kubectl describe pod web-native | grep -A2 "Init Containers"
```

**What you'll see:** the init container with `restartPolicy: Always` is up and **does not block** the start of the main one. `READY 2/2`. Per the spec it will terminate **after** the main one when the pod is deleted.

If your version is 1.28-, you'll see a validation error (`restartPolicy` is not allowed in init).

## Task 5. Init + sidecar together

```yaml
apiVersion: v1
kind: Pod
metadata: { name: full }
spec:
  restartPolicy: Never
  initContainers:
    - name: prep
      image: busybox
      command: ["sh", "-c", "echo init-done > /work/marker"]
      volumeMounts:
        - name: shared
          mountPath: /work
  containers:
    - name: app
      image: busybox
      command: ["sh", "-c", "while true; do date; sleep 5; done > /work/app.log"]
      volumeMounts:
        - name: shared
          mountPath: /work
    - name: tailer
      image: busybox
      command: ["sh", "-c", "sleep 1; tail -F /work/app.log"]
      volumeMounts:
        - name: shared
          mountPath: /work
  volumes:
    - name: shared
      emptyDir: {}
```

```bash
kubectl apply -f full.yaml
kubectl wait --for=condition=ready pod/full
kubectl logs full -c tailer
```

**What you'll see:** the init ran, app writes the date to a file, and the sidecar exposes it via `kubectl logs`. This is, in miniature, the "application + log collector" pattern from real clusters.

## Cleanup

```bash
kubectl delete namespace lab-init
kubectl config set-context --current --namespace=default
```

## Self-check questions

1. When does an init container run — before, after, or together with the main ones?
2. What happens if the init container fails with `exit 1`?
3. How does a native sidecar (1.29+) differ from an ordinary second container?
4. How do you reach the logs of a specific container in a pod with two of them?
5. How can two containers in one Pod "share" data?
