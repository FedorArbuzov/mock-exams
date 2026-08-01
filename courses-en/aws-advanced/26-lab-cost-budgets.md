# 26. Lab: budget and cost report

A short lab within aws-advanced. **Full track:** [finops/README.md](../finops/README.md) — [13-lab-budgets-tags](../finops/13-lab-budgets-tags.md), [14-lab-cost-report](../finops/14-lab-cost-report.md).

## Task 1. Tag policy (Organizations)

Require tags `Environment`, `Team` on resources (SCP or Tag Policies).

## Task 2. Budget

Terraform from [25-cost-optimization.md](25-cost-optimization.md) — email alert at 80% forecast.

## Task 3. Cost Explorer

Console → Cost Explorer → Group by **Service** for the last 7 days. Find the top 3 after the EKS lab.

## Task 4. Report in README

Table:

| Service | $ | Recommendation |
|---|---|---|
| EC2 | | rightsizing |
| NAT | | delete after the lab |

## Task 5. Cleanup checklist

A script or checklist from [optional-aws-advanced.md](optional-aws-advanced.md).

## Success criteria

- [ ] Budget created
- [ ] All training resources tagged
- [ ] Report + cleanup done

Next lesson: [27-final-project.md](27-final-project.md).
