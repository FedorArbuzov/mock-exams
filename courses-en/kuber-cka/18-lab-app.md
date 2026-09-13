# 18. Lab: deploy the shop app

Install the course application. It exists to create Kubernetes dependencies, not business logic.

```text
frontend  →  backend  →  redis
```

Manifests: [`app/`](app/). Copy them to `~/kuber-cka/app` if you want a local tree, or apply from the repo.

## Task

In namespace `shop`:

- Deployment + Service `frontend`
- Deployment + Service `backend`
- Deployment + Service `redis` with a PVC
- ConfigMap / Secret as in the manifests

All workloads Ready.

**Check** asserts the three Deployments are Ready.

Next: [19. Validate Ingress](19-lab-ingress.md).
