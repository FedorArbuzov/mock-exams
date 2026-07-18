# 09. Kubernetes на bare metal

## Отличия от managed Kubernetes

| | EKS / GKE | Self-hosted на metal |
|---|---|---|
| Control plane | managed | вы (или Talos) |
| LoadBalancer Service | cloud LB | MetalLB, kube-vip |
| PersistentVolume | EBS | local disk, Ceph, NFS |
| CCM | есть | нет — нужны обходы |

## Установка кластера

| Способ | Описание |
|---|---|
| **kubeadm** | классика: init control plane + join workers |
| **kops** | IaC для AWS; для metal — реже |
| **Talos Linux** | immutable OS, API вместо SSH |
| **RKE2 / K3s** | упрощённые дистрибутивы |
| **Metal3** | Kubernetes управляет bare metal (IPMI) |

`mockctl`/minikube — **не** production path, но учит API и объекты.

## MetalLB

Сервис типа `LoadBalancer` на bare metal:

```text
Service LoadBalancer IP (из пула MetalLB)
    → ARP/BGP объявляет IP на ноде
    → трафик приходит на pod
```

В облаке эту роль делает AWS Load Balancer Controller.

## Storage

| Вариант | Плюс | Минус |
|---|---|---|
| **local-path-provisioner** | просто | нет репликации |
| **Rook/Ceph** | distributed | сложность |
| **Longhorn** | проще Ceph | overhead |
| **NFS** | shared | SPOF без HA NFS |

StatefulSet на metal — планировать **привязку к ноде** и backup.

## Сеть CNI

Calico, Cilium — BGP с TOR (advanced). См. `kuber-advanced` NetworkPolicy.

## Связь с aws-advanced

EKS worker nodes **физически** тоже bare metal в AWS DC — вы просто не управляете ими.

## Чек-лист

- Зачем MetalLB?
- Почему нет EBS на metal?
- kubeadm vs Talos?
- local PV — риск при drain?

Следующий урок: [10-when-bare-metal.md](10-when-bare-metal.md).
