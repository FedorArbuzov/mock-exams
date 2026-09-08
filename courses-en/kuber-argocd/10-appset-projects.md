# 10. AppProject, app-of-apps, ApplicationSet

## AppProject

`project: default` allows any repo and any destination. An **AppProject** is the RBAC-ish box around Applications:

- which **sourceRepos** may be used  
- which **destinations** (cluster + namespace)  
- which **cluster-scoped** kinds may be created (Namespace, CRD, …)

Platform teams: one project per team or per product. Labs: project **`shop`** for staging/prod/final.

## App-of-apps (know it for interviews)

A **root** Application whose `path` contains **child Application YAMLs**. Syncing the root creates/updates child Applications.

```text
root (Application)
 ├── Application shop-staging   path: charts/shop
 └── Application shop-prod      path: charts/shop
```

Bootstrap: `kubectl apply` the root once (or a bootstrap Application). Children live in Git — that is the GitOps part.

**Downsides:** nested Applications, easy finalizer disasters (`resources-finalizer.argocd.argoproj.io` cascades deletes), lots of YAML clones.

You should be able to **explain** app-of-apps. This course **does not** make you operate a root app.

## ApplicationSet (what we lab)

An **ApplicationSet** is a controller that **generates** Applications from a template + **generators**.

Common generators:

| Generator | Use |
|-----------|-----|
| **list** | fixed envs (staging, prod) — this lab |
| **git** | one Application per folder in Git |
| **cluster** | one Application per registered cluster |
| **matrix / merge** | combine generators |

List generator (classic `{{env}}` placeholders):

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: shop-envs
  namespace: argocd
spec:
  generators:
    - list:
        elements:
          - env: staging
            namespace: lab-argocd-staging
          - env: prod
            namespace: lab-argocd-prod
  template:
    metadata:
      name: "shop-{{env}}"
    spec:
      project: shop
      source:
        repoURL: https://github.com/YOU/gitops-lab.git
        path: charts/shop
        helm:
          valueFiles:
            - "values-{{env}}.yaml"
      destination:
        server: https://kubernetes.default.svc
        namespace: "{{namespace}}"
```

Change the template **once**; both envs pick it up. Delete the ApplicationSet and (depending on policy) children may remain — read the ApplicationSet `syncPolicy` if you need cascade.

## Which to choose

| Situation | Prefer |
|-----------|--------|
| Two known envs, same chart | **ApplicationSet** list |
| Ten microservices, each a folder | git generator **or** app-of-apps |
| Interview “how do you bootstrap a platform?” | mention **both**; say ApplicationSet is the Argo-native generator |

## Checklist

- [ ] What does AppProject restrict?  
- [ ] App-of-apps vs ApplicationSet — one sentence each  
- [ ] Why `values-{{env}}.yaml` belongs in Git, not in the ApplicationSet only?  

Next lab: [11. Lab: staging + prod with ApplicationSet](11-lab-appset.md).
