# Kubernetes Basic

A beginner Kubernetes course. Assumes a local **minikube** cluster (profile `mock-exams`) with `kubectl` installed.

**Prerequisites:** [`containers-basic`](../containers-basic/README.md) — images, Dockerfile, compose, networking and registries ([`deploy/containers`](../../deploy/containers/README.md)). Without it, Pods, Services and pull policy tend to feel arbitrary.

> This is the entry-level course. Next up: [`kuber-intermediate`](../kuber-intermediate/README.md), then [`kuber-advanced`](../kuber-advanced/README.md). Prepping for CKAD? See [`mock-ckad`](../mock-ckad/README.md). Full course map: [`courses/README.md`](../README.md).

## Syllabus

### Introduction

1. [Kubernetes cluster architecture](01-architecture.md)
2. [Docker vs containerd](02-docker-vs-containerd.md)
3. [Kubernetes building blocks](03-elements.md)
4. [kubectl basics](04-kubectl-basics.md)

### Pods

5. [Pods](05-pods.md)
6. [Writing Pods in YAML](06-pods-yaml.md)
7. [Lab: Pods](07-lab-pods.md)

### Controllers

8. [ReplicaSet](08-replicaset.md)
9. [Lab: ReplicaSet](09-lab-replicaset.md)
10. [Deployment](10-deployment.md)
11. [Lab: Deployment](11-lab-deployment.md)

### Config and a "real" app

12. [ConfigMap and Secret](12-config-and-secret.md)
13. [Lab: ConfigMap and Secret](13-lab-config-and-secret.md)
14. [Probes and Resources](14-probes-and-resources.md)
15. [Lab: Probes and Resources](15-lab-probes-and-resources.md)

### Networking and organization

16. [Service](16-service.md)
17. [Lab: Service](17-lab-service.md)
18. [Namespace](18-namespace.md)
19. [Lab: Namespace](19-lab-namespace.md)
20. [Ingress](20-ingress.md)
21. [Lab: Ingress](21-lab-ingress.md)

### Running it in production

22. [Troubleshooting](22-troubleshooting.md)
23. [Lab: Troubleshooting](23-lab-troubleshooting.md)

## What the labs need

- A running cluster: `scripts\minikube-up.cmd` (Windows) or `./scripts/minikube-up.sh` (macOS).
- `kubectl` on your `PATH`, or invoked with `--kubeconfig .\output\kubeconfig.yaml`.
- Sanity check: `kubectl get nodes` shows the node as `Ready`.
- For lessons 14–15 (Probes and Resources): `minikube -p mock-exams addons enable metrics-server`.
- For lessons 20–21 (Ingress): `minikube -p mock-exams addons enable ingress`.

## A note on shell examples

Most commands in this course are plain `kubectl` and work the same way in bash and PowerShell. Where a step genuinely needs a shell loop or text processing (piping through `sed`, building a list with `$(...)`), both a bash version and a PowerShell version are given.
