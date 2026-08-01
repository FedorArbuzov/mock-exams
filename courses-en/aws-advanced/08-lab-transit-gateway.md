# 08. Lab: hub-spoke with Transit Gateway

> Real AWS. See [optional-aws-advanced.md](optional-aws-advanced.md).

## Architecture

```text
TGW
├── VPC hub (10.0.0.0/16) — shared services
├── VPC spoke-app (10.1.0.0/16)
└── VPC spoke-data (10.2.0.0/16)
```

## Task 1. Terraform modules

- `aws_ec2_transit_gateway`
- `aws_ec2_transit_gateway_vpc_attachment` × 3
- Route in spoke: `10.0.0.0/16` → TGW; in hub: spokes CIDR → TGW

## Task 2. Verification

An instance in spoke-app `ping`s a private IP in spoke-data (SG allows ICMP).

## Task 3. Documentation

In the README, draw a table of route tables (VPC + TGW).

## Simplified track (no AWS bill)

Draw a diagram and write a Terraform **plan-only** (`terraform plan` without apply) — sufficient for a study group without an org.

## Success criteria

- [ ] 3 VPCs attached to one TGW
- [ ] Spoke-to-spoke connectivity
- [ ] `terraform destroy` removed the TGW

Next lesson: [09-route53-privatelink.md](09-route53-privatelink.md).
