# 01. Terraform: HCL, provider, plan/apply

You already have **LocalStack** running ([ENVIRONMENT.md](ENVIRONMENT.md)). This lesson is only about Terraform: what it is, how to install it, and what you will type in the next lab.

## Why not click in a console

A bucket created in the AWS Console exists in *your* account, with *your* clicks, and nobody can replay it. **Infrastructure as Code** means the same files live in Git as the application: `terraform apply` from a commit is how the bucket appears.

Terraform is a popular choice because one language (HCL) talks to AWS, Kubernetes, GitHub, … CloudFormation is AWS-only. The cost: Terraform keeps a **state file** — we will treat that as sacred starting in lesson 03.

## Install Terraform

The CLI runs **on your laptop**, not inside the LocalStack container. Need **1.5 or newer**.

Full official instructions (zip for every OS, Linux apt/yum, checksums): **[developer.hashicorp.com/terraform/install](https://developer.hashicorp.com/terraform/install)**.

Package managers, if you prefer:

```powershell
# Windows — id is Hashicorp.Terraform (lowercase c). -e is case-sensitive.
winget install --id Hashicorp.Terraform -e
```

Close the terminal and open a **new** one, then `terraform version`.

```bash
# macOS
brew tap hashicorp/tap
brew install hashicorp/tap/terraform
terraform version
```

Linux: use the apt/yum steps on the HashiCorp page, or unpack a zip into `/usr/local/bin`.

## Three blocks you will see everywhere

A tiny project is three kinds of block. You do **not** apply this snippet yet — it talks to real AWS. Lab 02 points the same shapes at LocalStack.

```hcl
terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

resource "aws_s3_bucket" "course" {
  bucket = "my-unique-bucket-name-12345"
}
```

- **`terraform`** — which Terraform and which plugins. `init` reads this and downloads the AWS provider.
- **`provider "aws"`** — how to reach AWS (region, keys). In the lab this block will include LocalStack endpoints.
- **`resource`** — one object to create. The address is `aws_s3_bucket.course`: type + local name.

`data` blocks read existing things. Skip them until you need them.

## Four commands

```bash
terraform init      # once per project (and after you change required_providers)
terraform plan      # show the diff; changes nothing
terraform apply     # make the world match the files (asks yes)
terraform destroy   # end of the course: delete everything this project created
```

`fmt` and `validate` are hygiene — useful, not the plot. **init** is not optional: without it there is no AWS plugin.

Terraform is **declarative**. You describe the desired bucket; the engine diffs against state. A second `apply` with no file changes should print `No changes`. If a Lambda uses an IAM role, Terraform creates the role first — references in HCL are enough, `depends_on` is the exception.

After `apply` you will find **`terraform.tfstate`** in the folder. That file *is* Terraform's memory. Do not commit it (secrets leak). Lesson 03 is entirely about that file.

## Next

Install is done when `terraform version` prints `v1.5` or higher. Then write one bucket and actually apply it: [02-lab-terraform-intro.md](02-lab-terraform-intro.md).
