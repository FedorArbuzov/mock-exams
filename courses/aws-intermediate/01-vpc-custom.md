# 01. Custom VPC: subnets и маршрутизация

## Зачем custom VPC

**Default VPC** подходит для экспериментов. В production создают **свою VPC** с предсказуемой адресацией и разделением public/private.

```text
VPC 10.0.0.0/16
├── public-a   10.0.1.0/24  (eu-central-1a)  → 0.0.0.0/0 → Internet Gateway
├── public-b   10.0.2.0/24  (eu-central-1b)
├── private-a  10.0.10.0/24 (eu-central-1a)  → 0.0.0.0/0 → NAT Gateway (в public-a)
└── private-b  10.0.20.0/24 (eu-central-1b)  → NAT Gateway
```

## Компоненты Terraform

| Resource | Роль |
|---|---|
| `aws_vpc` | CIDR блок |
| `aws_subnet` | Подсеть в одной AZ (`availability_zone`) |
| `aws_internet_gateway` | Выход в интернет для public |
| `aws_nat_gateway` | Исходящий интернет для private (без входящего) |
| `aws_route_table` + `aws_route_table_association` | Маршруты на subnet |
| `aws_eip` | Публичный IP для NAT |

## Public vs private

| | Public subnet | Private subnet |
|---|---|---|
| Маршрут в интернет | IGW | NAT |
| Типичные ресурсы | ALB, bastion, NAT | App, Lambda (с VPC), RDS |
| Публичный IP на instance | опционально | нет |

## CIDR-планирование

- VPC `/16` → до 65k IP (реально меньше из-за AWS reserved).
- Subnet `/24` → 256 адресов, минус reserved AWS ≈ 251 usable.
- Оставляйте запас под **будущие** subnets (EKS, Lambda ENI).

## LocalStack

VPC API эмулируется **упрощённо**. Лаба 02 учит **правильному Terraform**; поведение NAT/ALB может отличаться. Полный сетевой опыт — [optional-aws.md](optional-aws.md).

## Чек-лист

- Зачем две AZ для production subnet?
- Почему RDS только в private?
- Чем IGW отличается от NAT?
- Зачем отдельная route table на subnet?

Следующий урок: [02-lab-vpc-custom.md](02-lab-vpc-custom.md).
