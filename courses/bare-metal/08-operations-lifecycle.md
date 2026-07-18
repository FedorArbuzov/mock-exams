# 08. Эксплуатация: патчи, firmware, lifecycle

## Жизненный цикл сервера

```text
Заказ → rack & cable → provision OS → join cluster → production
    → patch cycle → hardware failure / EOL → decommission
```

## Патчи ОС

| Тип | Пример | Риск |
|---|---|---|
| Security errata | CVE kernel | reboot |
| Minor update | glibc | low |
| Major | 8 → 9 | high, планировать |

**Unattended-upgrades** на серверах — осторожно; в K8s — **drain node** → patch → uncordon.

```bash
kubectl drain node1 --ignore-daemonsets --delete-emptydir-data
# patch & reboot on node1
kubectl uncordon node1
```

## Firmware

- BIOS/UEFI, RAID controller, NIC, BMC — отдельно от `yum update`.
- Окно maintenance, риск «кирпича» — через BMC recovery.
- Dell Lifecycle Controller, HPE SPP — bundle updates.

## Мониторинг железа

| Источник | Метрики |
|---|---|
| **node_exporter** | CPU, mem, disk |
| **ipmi_exporter** | temps, power, SEL |
| **smartctl exporter** | disk health |

Алерты: RAID degraded, rising ECC errors, fan failure.

## Decommission

1. Drain workloads.
2. Удалить из inventory / Terraform / MAAS.
3. Wipe disks (**NIST wipe** / shred).
4. Снять с учёта, возврат/leasing.

## Документация

Runbook как в [`aws-advanced`](../aws-advanced/22-lab-guardduty-config.md) — но для «диск красный в RAID».

## Чек-лист

- Почему patch ноды через drain?
- Firmware vs OS package?
- Что такое SEL?
- Wipe перед утилизацией — зачем?

Следующий урок: [09-kubernetes-on-bare-metal.md](09-kubernetes-on-bare-metal.md).
