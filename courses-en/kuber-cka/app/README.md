# Shop test application

```text
Internet → Ingress app.example.com → frontend → backend → redis
```

Apply from the repo (after the cluster exists):

```bash
export KUBECONFIG=$HOME/.kube/kuber-cka.conf
kubectl apply -k courses-en/kuber-cka/app
```

Images: `nginx:1.27`, `hashicorp/http-echo:1.0.0`, `redis:7-alpine`.

The backend image only serves a static body. Redis is still a real dependency for NetworkPolicy, PVC, and Secret labs. Do not replace this with a notebook or ML stack.
