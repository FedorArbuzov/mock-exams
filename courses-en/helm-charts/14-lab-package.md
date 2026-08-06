# 14. Lab: `helm package` and local OCI registry

## Setup

Needs Docker. Run a local registry:

```bash
docker rm -f registry 2>/dev/null || true
docker run -d --name registry -p 5001:5000 registry:2
cd ~/helm-work
kubectl create namespace lab-helm-oci
kubectl config set-context --current --namespace=lab-helm-oci
helm create boxed
# bump version for a clear package name
# edit boxed/Chart.yaml version: 0.2.0
```

Set `version: 0.2.0` in `boxed/Chart.yaml`.

## Task 1. Package

```bash
helm lint ./boxed
helm package ./boxed
ls boxed-0.2.0.tgz
```

## Task 2. Push to local OCI

Helm talks to the registry over HTTP on localhost — enable plain HTTP for this lab:

```bash
export HELM_EXPERIMENTAL_OCI=1
helm push boxed-0.2.0.tgz oci://127.0.0.1:5001/helm-charts
```

If push fails on HTTPS, create/use a Helm registries config allowing insecure local host (Helm 3.8+):

```bash
# alternative: use ORAS or skip push and install from .tgz
helm install boxed-from-tgz boxed-0.2.0.tgz
```

Prefer getting `helm push` working; if the environment blocks insecure OCI, completing install from the `.tgz` still counts for packaging practice.

## Task 3. Install from package

```bash
helm install boxed boxed-0.2.0.tgz --wait
helm list
kubectl get pods
```

## Cleanup

```bash
helm uninstall boxed 2>/dev/null || helm uninstall boxed-from-tgz 2>/dev/null || true
kubectl delete namespace lab-helm-oci
docker rm -f registry
kubectl config set-context --current --namespace=default
```

## Self-check

1. What file does `helm package` produce?
2. Why bump `Chart.yaml` `version` before packaging?

Next: [15-ci-and-gitops.md](15-ci-and-gitops.md).
