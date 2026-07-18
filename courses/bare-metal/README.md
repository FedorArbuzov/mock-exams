# Bare Metal для DevOps

Текстовый курс о **физических серверах** в дата-центре и on-prem: железо, BMC, сеть, установка ОС, эксплуатация. Без обязательных лаб — только теория и чек-листы.

**Для кого:** DevOps / SRE / platform engineer, которые работали только с облаком или Kubernetes, и хотят понимать, что под ними «внизу».

**Предварительно:** [`linux-basic`](../linux-basic/README.md) (практика Linux) и [`kuber-basic`](../kuber-basic/README.md) (контейнеры). Облако — [`aws-basic`](../aws-basic/README.md).

## Программа (теория)

1. [Bare metal, VM и облако](01-intro-bare-metal.md)
2. [Серверное железо](02-server-hardware.md)
3. [BMC, IPMI, iDRAC, iLO](03-bmc-out-of-band.md)
4. [Стойка, питание, физическая сеть](04-rack-power-network.md)
5. [Установка ОС: PXE, Kickstart, cloud-init](05-os-provisioning.md)
6. [Диски: RAID, LVM, файловые системы](06-storage-raid-lvm.md)
7. [Сеть на хосте: bonding, VLAN, MTU](07-host-networking.md)
8. [Эксплуатация: патчи, firmware, lifecycle](08-operations-lifecycle.md)
9. [Kubernetes и bare metal](09-kubernetes-on-bare-metal.md)
10. [Когда выбирать bare metal](10-when-bare-metal.md)

## Что должно получиться

- Отличаете bare metal от VM и от managed cloud.
- Понимаете, зачем BMC и зачем нельзя «потерять» IPMI-сеть.
- Знаете, что такое PXE/Kickstart и как это соотносится с cloud-init в AWS.
- Можете обсудить с админами ЦОД RAID, bonding и VLAN без пробелов в терминах.

## Связь с другими курсами

| Тема bare metal | Курс в репозитории |
|---|---|
| Kubernetes на нодах | `kuber-*`, Talos/Metal3 — урок 09 |
| Сеть как в VPC | `aws-basic` / `aws-intermediate` |
| CI установки образов | `gitlab-*` |
| Практика Linux на хосте | `linux-basic` → `linux-intermediate` |
| IaC для серверов | `aws-terraform` (аналогия), вне курса — Ansible/Terraform MAAS |

## Дальше (самостоятельно)

- [Linux Foundation](https://training.linuxfoundation.org/) — системное администрирование.
- Практика: homelab (один сервер), MAAS, Talos, Metal3.
- Сертификации: нет единого «bare metal CKA», но LPIC, RHCSA пересекаются.
