# 14. Lab: minimal EKS

## Track A — EKS (real AWS)

```bash
eksctl create cluster \
  --name course-advanced \
  --region eu-central-1 \
  --nodes 2 \
  --node-type t3.medium \
  --managed

kubectl get nodes
```

Deletion:

```bash
eksctl delete cluster --name course-advanced
```

## Track B — mockctl (no EKS bill)

For architecture comparison:

```bash
mockctl up
kubectl get nodes
```

Fill in the table:

| Question | minikube | EKS |
|---|---|---|
| Where is the API server? | | |
| Where is etcd? | | |
| How to add a node? | | |
| Cost | | |

## Task 1. Add-ons

On EKS:

```bash
aws eks describe-addon-versions --kubernetes-version 1.29
eksctl create addon --name aws-ebs-csi-driver --cluster course-advanced
```

## Task 2. Deploy a sample

```bash
kubectl create deployment nginx --image=nginx
kubectl expose deployment nginx --port=80 --type=ClusterIP
```

## Success criteria

- [ ] `kubectl get nodes` Ready
- [ ] minikube vs EKS comparison table filled in
- [ ] Cluster deleted (track A)

Next lesson: [15-irsa.md](15-irsa.md).
