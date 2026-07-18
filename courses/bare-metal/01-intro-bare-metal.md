# 01. Bare metal, VM и облако

## Три уровня «сервера»

```text
Bare metal          Виртуализация           Облако (managed)
──────────          ─────────────           ────────────────
Физический CPU      Hypervisor (KVM/ESXi)   API → VM на чужом железе
Вы ставите ОС       vCPU / vRAM             EC2, GKE node pool
Вы отвечаете за всё  Shared или dedicated   Провайдер — железо, вы — ОС+
```

| | Bare metal | VM на своём железе | Cloud VM |
|---|---|---|---|
| Старт | дни (заказ, доставка) | минуты | секунды |
| Гранулярность | целый сервер | доли CPU | instance type |
| Соседи | нет (один tenant на железо) | другие VM на хосте | multi-tenant |
| Цена при 100% load | часто выгоднее | средняя | pay-as-you-go |

## Гипервизор

**Type 1** (bare metal hypervisor): VMware ESXi, Xen — ОС гипервизора прямо на железе.

**Type 2**: KVM/QEMU внутри Linux — DevOps чаще видит это в облаке и на `minikube` (VM внутри Docker на macOS/Windows).

## Зачем bare metal в 2026

- **Предсказуемая производительность** — нет noisy neighbor на CPU (GPU, HPC, low-latency trading).
- **Лицензии** — иногда дешевле, чем vCPU в облаке.
- **Данные и compliance** — on-prem, air-gapped.
- **Kubernetes control plane** или **stateful** нагрузки с локальными NVMe.
- **Edge** — сервер в филиале без облака.

## Зачем облако всё равно

Elasticity, managed DB, global footprint. Типичный гибрид: **bare metal / on-prem** для стабильного core, **cloud** для burst и managed services.

## Связь с mock-exams

`mockctl` / minikube — **не** bare metal: это VM на вашем ноутбуке. Но **worker nodes** в production EKS/self-hosted k8s часто сидят на физических машинах или на VM в ЦОД.

## Чек-лист

- Чем bare metal отличается от EC2?
- Type 1 vs Type 2 hypervisor?
- Назовите два сценария, где bare metal оправдан.
- minikube — это bare metal?

Следующий урок: [02-server-hardware.md](02-server-hardware.md).
