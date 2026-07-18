# 19. Модули Terraform

## Зачем модули

Повторяющиеся блоки (S3 bucket с encryption + block public) выносят в **модуль** — один раз написали, вызываете в dev/staging/prod с разными `tfvars`.

```text
root/
  main.tf          → module "images_bucket" { source = "./modules/s3-bucket" }
  modules/
    s3-bucket/
      main.tf
      variables.tf
      outputs.tf
```

## Вызов модуля

```hcl
module "uploads_bucket" {
  source = "./modules/s3-bucket"

  bucket_name = var.bucket_name
  tags        = local.common_tags
}

output "bucket_arn" {
  value = module.uploads_bucket.bucket_arn
}
```

## Интерфейс модуля

`variables.tf` — входы; `outputs.tf` — что отдаём наружу. Внутренние ресурсы не экспортируются, если не нужны.

## Версионирование

```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"
  # ...
}
```

Registry: [registry.terraform.io](https://registry.terraform.io/).

## State

Модули — часть **одного state** root-модуля (не отдельный state, если не nested stack).

## Когда НЕ плодить модули

Один учебный проект на 5 ресурсов — плоский `.tf` читабельнее. Модули окупаются с 2–3 повторениями.

## Чек-лист

- Чем `module` отличается от `resource`?
- Где хранится state для submodule?
- Зачем `outputs` у модуля?

Следующий урок: [20-lab-modules.md](20-lab-modules.md).
