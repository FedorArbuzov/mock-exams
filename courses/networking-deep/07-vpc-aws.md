# 07. VPC AWS: SG vs NACL, peering, endpoints, TGW

## Введение

VPC — **изолированная L3-сеть** в регионе. Понимание SG/NACL и маршрутов отделяет «открыл порт в приложении» от «трафик до ENI не доходит». Расширяет [aws-intermediate/01](../aws-intermediate/01-vpc-custom.md) и [03](../aws-intermediate/03-alb-security-groups.md).

---

## Security Group vs NACL

| | Security Group | Network ACL |
|---|----------------|---------------|
| Уровень | ENI instance / LB | Subnet |
| Stateful | да | нет (нужны оба направления) |
| Правила | allow only | allow + deny |
| Default | deny inbound | allow all (default ACL) |

**Порядок:** NACL (subnet edge) → SG (instance). Оба должны пропустить.

Типичный debug:

1. SG inbound на target: port app?
2. SG outbound: egress open или к конкретному?
3. NACL: ephemeral 1024-65535 return path?
4. Route table: subnet правильный?

---

## Peering и non-overlapping CIDR

VPC Peering — **L3 связь** между VPC; **нет транзита** (A↔B и B↔C не дают A↔C через B без full mesh или TGW).

Требование: **непересекающиеся** CIDR. Конфликт `10.0.0.0/16` в двух VPC — peering невозможен без re-IP.

---

## VPC Endpoints

| Тип | Для чего |
|-----|----------|
| Gateway (S3, DynamoDB) | prefix list в route table |
| Interface (most services) | ENI + private DNS в subnet |

Зачем: трафик к S3 **не идёт** в интернет → дешевле, без NAT, меньше exposure.

---

## Transit Gateway (TGW)

Hub для VPC, VPN, Direct Connect. **Route tables** на TGW — кто видит какие префиксы.

```text
VPC prod ──┐
           ├── TGW ── VPN on-prem
VPC stage ─┘
```

В [aws-advanced/07](../aws-advanced/07-transit-gateway.md) — углубление.

---

## ALB и сеть

- ALB nodes в **нескольких AZ** — clients hit AZ-local nodes.
- Target в **private subnet** — SG: allow from ALB SG на app port.
- Health check source — **LB subnets**, не «интернет».

---

## LocalStack caveat

Эмуляция VPC **упрощена** — учите **модель** в Terraform, полный сетевой опыт — [optional-aws](../aws-intermediate/optional-aws.md) или dev account.

---

## В mock-exams

- Terraform VPC: [02-lab-vpc-custom](../aws-intermediate/02-lab-vpc-custom.md)
- Private RDS: [13-rds-private](../aws-intermediate/13-rds-private.md)
- TGW: [aws-advanced/07–08](../aws-advanced/07-transit-gateway.md)

---

## Резюме

VPC = **маршруты + stateful SG + stateless NACL**. Peering не заменяет TGW в hub-spoke. Endpoints убирают hairpin через NAT для AWS API.

---

## Чек-лист

- [ ] Нарисуйте путь Client → ALB → EC2 в private с SG.
- [ ] Почему NACL «разрешил 443», но return не идёт?
- [ ] Когда нужен TGW вместо peering mesh?

**Дальше:** [08. Overlay](08-overlay.md).
