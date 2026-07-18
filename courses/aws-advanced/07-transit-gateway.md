# 07. Transit Gateway и VPC Peering

## VPC Peering

Два VPC в одном или разных region — **прямое** L3 соединение.

| Плюс | Минус |
|---|---|
| Просто | Нет transitive routing (A↔B и B↔C ≠ A↔C) |
| Дёшево | Full mesh при N VPC — N² peering |

## Transit Gateway (TGW)

**Hub** для сотен VPC и on-prem (VPN/Direct Connect).

```text
        Transit Gateway
       /    |     \
   VPC-A  VPC-B  VPN (on-prem)
```

| Сценарий | Решение |
|---|---|
| 3+ VPC общаются | TGW |
| 2 VPC, один region | Peering OK |
| Shared services (egress, DNS) | TGW + central VPC |

## Route tables TGW

Отдельные **TGW route tables** — какие attachments видят какие CIDR.

- **Spoke VPC** — default route `0.0.0.0/0` → central egress VPC.
- **Inspection VPC** — firewall appliances (advanced).

## RAM (Resource Access Manager)

Share TGW/subnets across accounts в Organizations.

## Стоимость

TGW — **почасовая** плата + data processing per GB. Для лаб — создать и **удалить** в тот же день.

## Чек-лист

- Почему peering плохо масштабируется?
- Transitive routing — что даёт TGW?
- Зачем central egress VPC?
- RAM — зачем в multi-account?

Следующий урок: [08-lab-transit-gateway.md](08-lab-transit-gateway.md).
