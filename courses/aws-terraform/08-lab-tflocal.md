# 08. Лаба: workflow с tflocal

## Подготовка

```bash
pip install terraform-local
docker compose -f deploy/localstack/docker-compose.yml up -d
mkdir -p ~/aws-labs/lesson-08 && cd ~/aws-labs/lesson-08
```

## Задание 1. Минимальный проект (без endpoints)

`versions.tf` — как в уроке 02.

`provider.tf`:

```hcl
provider "aws" {
  region = "us-east-1"
}
```

`main.tf`:

```hcl
resource "aws_s3_bucket" "tflocal_demo" {
  bucket = "tflocal-demo-yourname-001"
}
```

## Задание 2. tflocal init / apply

```bash
tflocal init
tflocal apply
```

**Что увидите:** файл `localstack_providers_override.tf` (автоген). Bucket создан.

## Задание 3. Обычный terraform (ожидаемая ошибка)

Остановите LocalStack или временно смените region на несуществующий endpoint — `terraform plan` без override может пойти в реальный AWS (осторожно: используйте пустой профиль или `AWS_ACCESS_KEY_ID=invalid` для теста).

**Вывод урока:** без override / tflocal код идёт в настоящий AWS — всегда проверяйте `echo $AWS_PROFILE`.

## Задание 4. Переключение на prod (теория)

Документируйте в README проекта:

```markdown
## Local
tflocal apply

## AWS dev
export AWS_PROFILE=course-dev
terraform apply -var-file=prod.tfvars
```

`prod.tfvars` без localstack-переменных.

## Критерии успеха

- [ ] `tflocal apply` создал bucket
- [ ] `localstack_providers_override.tf` в `.gitignore`
- [ ] `tflocal destroy` удалил bucket

Следующий урок: [09-iam-terraform.md](09-iam-terraform.md).
