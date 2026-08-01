# 01. Custom VPC: subnets and routing

## Why a custom VPC

**Default VPC** is fine for experiments. In production you create **your own VPC** with predictable addressing and public/private separation.

```text
VPC 10.0.0.0/16
├── public-a   10.0.1.0/24  (eu-central-1a)  → 0.0.0.0/0 → Internet Gateway
├── public-b   10.0.2.0/24  (eu-central-1b)
├── private-a  10.0.10.0/24 (eu-central-1a)  → 0.0.0.0/0 → NAT Gateway (in public-a)
└── private-b  10.0.20.0/24 (eu-central-1b)  → NAT Gateway
```

## Terraform components

| Resource | Role |
|---|---|
| `aws_vpc` | CIDR block |
| `aws_subnet` | Subnet in one AZ (`availability_zone`) |
| `aws_internet_gateway` | Internet egress for public |
| `aws_nat_gateway` | Outbound internet for private (no inbound) |
| `aws_route_table` + `aws_route_table_association` | Routes for a subnet |
| `aws_eip` | Public IP for NAT |

## Public vs private

| | Public subnet | Private subnet |
|---|---|---|
| Route to the internet | IGW | NAT |
| Typical resources | ALB, bastion, NAT | App, Lambda (with VPC), RDS |
| Public IP on instance | optional | no |

## CIDR planning

- VPC `/16` → up to 65k IPs (fewer in practice due to AWS reserved).
- Subnet `/24` → 256 addresses, minus AWS reserved ≈ 251 usable.
- Leave room for **future** subnets (EKS, Lambda ENI).

## LocalStack

The VPC API is emulated in a **simplified** way. Lab 02 teaches **correct Terraform**; NAT/ALB behavior may differ. Full networking experience — [optional-aws.md](optional-aws.md).

## Checklist

- Why two AZs for production subnets?
- Why put RDS only in private?
- How does IGW differ from NAT?
- Why a separate route table per subnet?

Next lesson: [02-lab-vpc-custom.md](02-lab-vpc-custom.md).
