# Terraform Shorts: Complete beginner course

Goal: turn shorts into a coherent course that takes a beginner from ClickOps pain to confident plan/apply, state, modules, and CI for AWS.
Recommended length per video: **45–75 seconds** (target ~65–75 when the topic needs texture).

Shared CTA (end of every short — English publishing voice-over):
`Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio.`

Module order = study order: why IaC → HCL & providers → plan/apply → state → variables → AWS resources → modules → workspaces/envs → CI → pitfalls → career.

Pipeline guide: `terraform-shorts-pipeline-prompt.md`.

**Status:** lessons **1–112** have `videos-terraform/<N> …/script.txt` + Remotion under `remotion/src/series/terraform/episodes/`.

## Module 0. Start and orientation (1–12)

Format for every item:
- **Hook:** a short beginner question/pain for the lesson topic.
- **Core:** a simple explanation + 1 practical anchor (command/rule/checklist).
- **CTA:** shared line above (do not invent a different CTA).

1. What is Terraform in 30 seconds  
   - **Hook:** "Everyone says use Terraform — what does it actually do?"
   - **Core:** Terraform turns `.tf` files into real cloud resources via providers: plan, then apply.
2. Why IaC beats ClickOps  
   - **Hook:** "Why not just click in the AWS Console?"
   - **Core:** Console is fast once; Git + plan/apply is repeatable, reviewable, and recoverable.
3. Declarative desired state  
   - **Hook:** "Do I write scripts that create a bucket step by step?"
   - **Core:** You describe the end state; Terraform computes the diff (create/update/delete).
4. HCL in plain words  
   - **Hook:** "Is HCL another programming language I must master?"
   - **Core:** HCL is a config language: blocks, arguments, expressions — readable by humans and Terraform.
5. Providers: plugins that talk to clouds  
   - **Hook:** "How does Terraform know how to call AWS?"
   - **Core:** A provider is a plugin (aws, kubernetes, …) that maps resources to APIs.
6. Resources vs data sources  
   - **Hook:** "When do I use `resource` and when `data`?"
   - **Core:** `resource` creates/manages; `data` reads existing things without owning them.
7. Plan then apply mental model  
   - **Hook:** "Can I just run apply and hope?"
   - **Core:** Always `plan` first — the plan is the review; apply executes that plan.
8. State file: the map of reality  
   - **Hook:** "Where does Terraform remember what it created?"
   - **Core:** `terraform.tfstate` maps addresses in code to real IDs — protect it like production data.
9. When you do not need Terraform  
   - **Hook:** "Should every weekend project use Terraform?"
   - **Core:** One-off experiments and tiny sandboxes can stay Console/CLI; Terraform pays off when you repeat or share.
10. Myth: Terraform is only for AWS  
    - **Hook:** "Is this an AWS-only tool?"
    - **Core:** Same workflow for many providers — AWS, GCP, Azure, Kubernetes, GitHub, …
11. Terraform vs CloudFormation vs Pulumi  
    - **Hook:** "Which IaC tool should I learn first?"
    - **Core:** Terraform = HCL multi-cloud; CloudFormation = AWS-native; Pulumi = real languages. Pick for team + cloud mix.
12. Mini checklist: first Terraform hour  
    - **Hook:** "What should I actually do in hour one?"
    - **Core:** install CLI → `init` → tiny resource → `plan` → `apply` → `destroy` — and never commit secrets.

---

## Module 1. Install, layout, first apply (13–24)

13. Install Terraform the clean way  
14. terraform version and required_version  
15. Project layout: one folder, many .tf files  
16. terraform init: what it downloads  
17. terraform fmt: free style consistency  
18. terraform validate: catch syntax early  
19. First resource: aws_s3_bucket (or local mock)  
20. terraform plan reading the diff  
21. terraform apply and confirmation  
22. terraform destroy without drama  
23. No changes: idempotency win  
24. Mini checklist: healthy first project  

---

## Module 2. Providers and authentication (25–36)

25. provider "aws" region and defaults  
26. Credentials: env vars vs shared config  
27. Assume role patterns (high level)  
28. Multiple providers / aliases  
29. required_providers lock file  
30. Provider version constraints (~> 5.0)  
31. LocalStack / tflocal for safe practice  
32. Endpoint overrides for local APIs  
33. Default tags on the provider  
34. Myth: Terraform stores your AWS keys in state (nuance)  
35. Never hardcode secrets in .tf  
36. Mini checklist: safe provider setup  

---

## Module 3. State, backends, locking (37–50)

37. What lives inside terraform.tfstate  
38. Why local state is dangerous for teams  
39. Remote backend: S3  
40. State locking with DynamoDB  
41. terraform state list  
42. terraform state show  
43. terraform refresh / -refresh-only  
44. Drift: Console changed it, Terraform notices  
45. terraform import (when you inherit ClickOps)  
46. terraform state mv / rm (careful surgery)  
47. Partial apply risk and targeting (-target)  
48. Workspaces vs separate state files  
49. Backend migrate without panic  
50. Mini checklist: state you can trust  

---

## Module 4. Variables, locals, outputs (51–64)

51. input variables basics  
52. terraform.tfvars and *.auto.tfvars  
53. variable types and validation  
54. sensitive variables  
55. locals for DRY expressions  
56. outputs for humans and other stacks  
57. -var and -var-file on the CLI  
58. Environment naming with variables  
59. count vs for_each (preview)  
60. Depends on vs implicit dependencies  
61. terraform console for expressions  
62. Conditional expressions carefully  
63. Dynamic blocks when YAML would explode  
64. Mini checklist: clean inputs/outputs  

---

## Module 5. Core AWS resources with Terraform (65–84)

65. IAM role + policy attachments  
66. Least privilege for Terraform itself  
67. S3 bucket + versioning + encryption  
68. Bucket public access blocks  
69. DynamoDB table basics  
70. Lambda function packaging high level  
71. API Gateway sketch  
72. VPC mental model in Terraform  
73. Security groups as code  
74. RDS instance caveats (state + destroy)  
75. ECR repository  
76. ECS/EKS pointers (when not to start here)  
77. CloudWatch log groups  
78. SNS / SQS wiring  
79. Tags everywhere for cost and ownership  
80. Resource naming conventions  
81. Lifecycle prevent_destroy  
82. Lifecycle ignore_changes  
83. create_before_destroy  
84. Mini checklist: AWS resources without landmines  

---

## Module 6. Modules (85–96)

85. Why modules exist  
86. Module sources: local path  
87. Module sources: registry  
88. module inputs and outputs  
89. Version pinning modules  
90. Root module vs child modules  
91. Don't module everything on day one  
92. Refactoring into a module safely  
93. Module composition patterns  
94. Publishing an internal module (idea)  
95. Anti-pattern: god module  
96. Mini checklist: modules that help  

---

## Module 7. Teams, CI, and day-2 (97–112)

97. PR review: read the plan artifact  
98. terraform plan in CI  
99. terraform apply from CI with guards  
100. OIDC to cloud (no long-lived keys)  
101. Separate states per env  
102. Policy as code (OPA / Sentinel idea)  
103. Cost estimation hooks  
104. Breaking changes and upgrades  
105. terraform providers lock  
106. Debugging: TF_LOG  
107. Common errors: already exists  
108. Common errors: access denied  
109. Common errors: state lock held  
110. Runbooks for failed apply  
111. Interview: explain plan vs apply vs state  
112. What next after the course  

---

## Visual / Remotion notes (all episodes)

Scene 1: large TopicBanner with the lesson topic title.
Prefer large on-screen HCL / CLI snippets (mono 38–50), plan diffs, and state/map metaphors.
Persistent brand footer: `exallenge.tech`. CTA card: Link in Bio. No QR.

Pipeline guide: `terraform-shorts-pipeline-prompt.md`.
