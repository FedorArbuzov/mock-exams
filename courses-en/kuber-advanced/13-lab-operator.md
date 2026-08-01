# 13. Lab: a minimal Tenant operator

> Requires Go 1.21+, ~4 GB RAM. A full build takes 30–60 min. You can go through the theory in [12-operators.md](12-operators.md) and skip the hands-on.

## Fast path (without writing code)

Install a ready-made operator to practice reconcile:

```bash
# Example: the nginx ingress operator is already in the cluster after mockctl up
kubectl get crd | grep nginx
```

Or use the `Tenant` CRD from [intermediate/26-lab-crd.md](../kuber-intermediate/26-lab-crd.md) and **manually** perform the operator's actions:

```bash
kubectl apply -f tenant.yaml    # Tenant alice
kubectl create namespace tenant-alice
kubectl patch tenant alice --subresource=status -p '{"status":{"phase":"Active"}}'
```

## Full path (kubebuilder)

```bash
# On a host with Go:
kubebuilder init --domain example.com --repo example.com/mock-operator
cd mock-operator
kubebuilder create api --group example --version v1 --kind Tenant
# Edit controllers/tenant_controller.go:
#   Reconcile: on a Tenant → ensure a Namespace named tenant-<metadata.name>
make install && make run
```

In another terminal:

```bash
kubectl apply -f config/samples/example_v1_tenant.yaml
kubectl get namespaces | grep tenant
```

## Questions

1. What does reconcile do when a Tenant is created?
2. Why does the controller write to status via a subresource?
