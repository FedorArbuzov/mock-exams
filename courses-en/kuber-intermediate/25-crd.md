# 25. CustomResourceDefinition (CRD)

## Why your own "kind"

All the built-in Kubernetes objects (Pod, Deployment, ConfigMap, Service…) are just JSON documents that live in etcd under keys like `/registry/pods/default/web`. The **API server** validates them, stores them in etcd, and serves them on request. **Controllers** (kube-controller-manager and others) process them.

A CRD lets you add **your own kind** to that same API server. After you apply the CRD you can do:

```bash
kubectl apply -f - <<EOF
apiVersion: example.com/v1
kind: Tenant
metadata: { name: t1 }
spec:
  owner: alice
EOF
kubectl get tenants
kubectl describe tenant t1
```

— just like with any built-in object. Without your own controller this will be a "database inside k8s" — just storage. If there's an **operator**, it subscribes to changes and reacts (creates a namespace, grants RBAC, etc.).

## What a CRD is

A `CustomResourceDefinition` is a meta-object that describes your resource. It specifies:

- the group (`example.com`);
- the version (`v1`);
- the resource name (`tenants`);
- whether it's `Namespaced` or `Cluster`-scoped;
- the **schema** (validating OpenAPI v3) for the fields.

A minimal CRD:

```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: tenants.example.com           # format: <plural>.<group>
spec:
  group: example.com
  scope: Namespaced
  names:
    kind: Tenant
    plural: tenants
    singular: tenant
    shortNames: [tn]
  versions:
    - name: v1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              required: [owner]
              properties:
                owner:
                  type: string
                quota:
                  type: integer
                  minimum: 1
                  maximum: 100
            status:
              type: object
              properties:
                phase:
                  type: string
```

After apply:

```bash
kubectl get crd tenants.example.com
kubectl api-resources | grep tenants
# tenants   tn          example.com/v1   true   Tenant
```

## Creating a resource

```yaml
apiVersion: example.com/v1
kind: Tenant
metadata: { name: alice }
spec:
  owner: alice
  quota: 5
```

The API server validates this against the schema. If `quota: 200` — it rejects it (`maximum: 100`). If `owner` is not set — it rejects it (`required`).

## Subresources: `/status`, `/scale`

```yaml
versions:
  - name: v1
    served: true
    storage: true
    subresources:
      status: {}
      scale:
        specReplicasPath: .spec.replicas
        statusReplicasPath: .status.replicas
        labelSelectorPath: .status.selector
```

What it gives you:

- **status** — a separate endpoint `kubectl patch tenant t --type=merge --subresource=status -p '{"status":{"phase":"Ready"}}'`. Controllers update only the status, without touching the spec. This is the correct pattern: "an operator must not overwrite the user's spec".
- **scale** — `kubectl scale tenant t --replicas=3` will work if there's `replicas` in spec/status.

## Additional columns

```yaml
versions:
  - name: v1
    served: true
    storage: true
    additionalPrinterColumns:
      - name: Owner
        type: string
        jsonPath: .spec.owner
      - name: Quota
        type: integer
        jsonPath: .spec.quota
      - name: Phase
        type: string
        jsonPath: .status.phase
      - name: Age
        type: date
        jsonPath: .metadata.creationTimestamp
```

`kubectl get tenants` will show the columns Owner / Quota / Phase / Age — just like built-in objects.

## Multiple versions and conversion

A CRD can have several versions at once:

```yaml
versions:
  - name: v1alpha1
    served: true
    storage: false
  - name: v1
    served: true
    storage: true
```

`storage: true` is the version in which the object is **physically stored** in etcd. `served: true` is a version served by the API. You can't have two `storage: true`.

If the schemas differ — you need a **conversion webhook** that converts one version into another. That's already advanced — we won't do it in this course.

## Where a CRD is not a good fit

- If you need **complex business logic** in the API server (impersonation, custom authorization). That's an `aggregated apiserver`, not a CRD.
- If the object is very large (50+ MB) — etcd is a poor storage for blobs.
- If you need **strict control** over schema migrations — CRD validation is good, but not at the SQL level.

In 95% of cases a CRD is enough.

## Useful commands

```bash
kubectl get crd
kubectl explain tenants.example.com.spec     # docs for the schema
kubectl get tenants -A
kubectl api-resources --api-group=example.com
```

## Checklist

- What's the difference between a CRD and a user object of that CRD?
- What happens if you apply an object that doesn't match the CRD schema?
- Why is `subresources.status` needed?
- How does `served` differ from `storage` in versions?
- In what case is a conversion webhook needed?

In the lab [26-lab-crd.md](26-lab-crd.md) we'll create our own `Tenant` CRD and practice working with it.
