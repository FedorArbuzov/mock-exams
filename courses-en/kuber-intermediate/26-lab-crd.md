# 26. Lab: your own `Tenant` CRD

## Setup

```bash
kubectl create namespace lab-crd
kubectl config set-context --current --namespace=lab-crd
```

## Task 1. Create the CRD

`crd.yaml`:

```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: tenants.example.com
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
      subresources:
        status: {}
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
                  minLength: 1
                quota:
                  type: integer
                  minimum: 1
                  maximum: 100
                  default: 10
                tier:
                  type: string
                  enum: [free, pro, enterprise]
                  default: free
            status:
              type: object
              properties:
                phase:
                  type: string
                createdNamespaces:
                  type: array
                  items:
                    type: string
      additionalPrinterColumns:
        - name: Owner
          type: string
          jsonPath: .spec.owner
        - name: Tier
          type: string
          jsonPath: .spec.tier
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

```bash
kubectl apply -f crd.yaml
kubectl get crd tenants.example.com
kubectl api-resources | grep tenants
```

**What you'll see:** `tenants` appeared in the api-resources list, group `example.com/v1`, namespaced.

## Task 2. Try an invalid object

```bash
cat <<EOF | kubectl apply -f -
apiVersion: example.com/v1
kind: Tenant
metadata: { name: bad }
spec:
  quota: 9000
EOF
```

**What you'll see:** the API server rejects it:

```text
error validating data: ... missing required field "owner" ... spec.quota: Invalid value: 9000: spec.quota in body should be less than or equal to 100
```

This is the built-in OpenAPI v3 validation at work.

## Task 3. Create valid objects

`tenants.yaml`:

```yaml
apiVersion: example.com/v1
kind: Tenant
metadata: { name: alice }
spec:
  owner: alice
  tier: pro
  quota: 25
---
apiVersion: example.com/v1
kind: Tenant
metadata: { name: bob }
spec:
  owner: bob
  # tier and quota will be taken from the defaults
```

```bash
kubectl apply -f tenants.yaml
kubectl get tenants
```

**What you'll see:** a table with the columns `OWNER TIER QUOTA PHASE AGE`. For `bob`, tier=`free`, quota=`10` (defaults).

## Task 4. The status subresource

```bash
kubectl patch tenant alice --type=merge --subresource=status -p \
  '{"status":{"phase":"Active","createdNamespaces":["alice-prod","alice-dev"]}}'
kubectl get tenant alice -o yaml | grep -A4 status
```

**What you'll see:** `.status.phase = Active`. Changing it through the subresource is the normal path for an operator.

Try to update the status via a regular `apply`:

```bash
cat <<EOF | kubectl apply -f -
apiVersion: example.com/v1
kind: Tenant
metadata: { name: alice }
spec:
  owner: alice
  tier: pro
  quota: 25
status:
  phase: Apply-Style
EOF
kubectl get tenant alice -o jsonpath='{.status.phase}{"\n"}'
```

**What you'll see:** the status **did not change**. When `subresources.status: {}` is declared in the CRD, a regular apply **ignores** changes to `.status`. That's exactly what you need to separate "the user's spec / the system's status".

## Task 5. Use the short name

```bash
kubectl get tn
kubectl describe tn alice
```

`tn` is the short name from the CRD. Handy for speed.

## Task 6. Deletion

```bash
kubectl delete tenant alice bob
kubectl delete crd tenants.example.com
kubectl get tenants 2>&1 | head -3
```

**What you'll see:** "server doesn't have a resource type tenants". The CRD is deleted — all of its objects are automatically deleted too.

## Cleanup

```bash
kubectl delete namespace lab-crd
kubectl config set-context --current --namespace=default
```

## Self-check questions

1. How does a CRD differ from a Tenant object (created from that CRD)?
2. What happens on `kubectl delete crd tenants.example.com` if there are existing Tenant objects?
3. Why is `subresources.status: {}` needed?
4. What are `served: true` and `storage: true`?
5. How do you set a default value for a field in a CRD?
