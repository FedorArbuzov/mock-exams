# 09. Lab: calico and egress NetworkPolicy

> Requires restarting minikube with calico:  
> `minikube delete -p mock-exams && minikube start -p mock-exams --driver=docker --cni=calico`  
> `mockctl kubeconfig`

The content matches [intermediate/12-lab-networkpolicy.md](../kuber-intermediate/12-lab-networkpolicy.md), but here the focus is on **egress** and verifying calico:

```bash
kubectl get pods -n kube-system -l k8s-app=calico-node
```

Repeat lab 12 from intermediate + add an egress policy that allows only DNS and backend:80.

## Extra: calicoctl (optional)

```bash
# If calicoctl is installed:
calicoctl get ippool -o wide
```

## Cleanup

When done — switch back to the regular CNI or keep calico for the advanced labs.
