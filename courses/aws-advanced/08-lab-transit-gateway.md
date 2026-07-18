# 08. Лаба: hub-spoke с Transit Gateway

> Real AWS. См. [optional-aws-advanced.md](optional-aws-advanced.md).

## Архитектура

```text
TGW
├── VPC hub (10.0.0.0/16) — shared services
├── VPC spoke-app (10.1.0.0/16)
└── VPC spoke-data (10.2.0.0/16)
```

## Задание 1. Terraform modules

- `aws_ec2_transit_gateway`
- `aws_ec2_transit_gateway_vpc_attachment` × 3
- Route в spoke: `10.0.0.0/16` → TGW; в hub: spokes CIDR → TGW

## Задание 2. Проверка

Instance в spoke-app `ping` private IP в spoke-data (SG разрешает ICMP).

## Задание 3. Документация

В README нарисуйте таблицу route tables (VPC + TGW).

## Упрощённый трек (без AWS bill)

Нарисуйте диаграмму и напишите Terraform **plan-only** (`terraform plan` без apply) — зачёт для учебной группы без org.

## Критерии успеха

- [ ] 3 VPC attached к одному TGW
- [ ] Spoke-to-spoke connectivity
- [ ] `terraform destroy` удалил TGW

Следующий урок: [09-route53-privatelink.md](09-route53-privatelink.md).
