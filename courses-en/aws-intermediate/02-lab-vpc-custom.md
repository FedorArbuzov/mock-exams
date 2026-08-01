# 02. Lab: VPC in Terraform

Create `~/aws-labs/intermediate-02/` or a `modules/network/` module.

## Task 1. variables.tf

```hcl
variable "vpc_cidr" { default = "10.0.0.0/16" }
variable "aws_region" { default = "us-east-1" }
variable "azs" { default = ["us-east-1a", "us-east-1b"] }
```

## Task 2. vpc.tf

```hcl
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = { Name = "course-vpc" }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "course-igw" }
}

resource "aws_subnet" "public" {
  count                   = length(var.azs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.azs[count.index]
  map_public_ip_on_launch = true
  tags = { Name = "public-${var.azs[count.index]}" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  tags = { Name = "public-rt" }
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}
```

Private subnet + NAT — add following the pattern from lesson 01 (optional on LocalStack).

## Task 3. outputs

```hcl
output "vpc_id" { value = aws_vpc.main.id }
output "public_subnet_ids" { value = aws_subnet.public[*].id }
```

## Task 4. apply

```bash
tflocal init
tflocal apply
```

**What you should see:** VPC and subnets in state; in LocalStack — simplified objects.

## Success criteria

- [ ] `terraform state list` contains vpc, subnets, igw, route table
- [ ] outputs return ids
- [ ] `destroy` cleans up the network

Next lesson: [03-alb-security-groups.md](03-alb-security-groups.md).
