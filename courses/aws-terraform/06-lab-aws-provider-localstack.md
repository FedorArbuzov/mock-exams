# 06. Лаба: LocalStack + provider

## Подготовка

Из корня репозитория `mock-exams`:

```bash
docker compose -f deploy/localstack/docker-compose.yml up -d
curl -s http://localhost:4566/_localstack/health
```

Windows PowerShell:

```powershell
docker compose -f deploy/localstack/docker-compose.yml up -d
Invoke-WebRequest -Uri http://localhost:4566/_localstack/health -UseBasicParsing
```

## Задание 1. provider.tf (полная версия)

Скопируйте паттерн из [05-aws-provider-localstack.md](05-aws-provider-localstack.md) в `~/aws-labs/lesson-02` или создайте `lesson-06`.

## Задание 2. apply bucket

```bash
cd ~/aws-labs/lesson-02
terraform apply -var-file=terraform.tfvars
```

## Задание 3. AWS CLI

```bash
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

aws --endpoint-url=http://localhost:4566 s3 ls
aws --endpoint-url=http://localhost:4566 s3 cp README.md s3://YOUR_BUCKET/test.txt
aws --endpoint-url=http://localhost:4566 s3 ls s3://YOUR_BUCKET/
```

## Задание 4. use_localstack flag

Добавьте `variable "use_localstack"` и `dynamic "endpoints"` из урока 05.

`local.tfvars`:

```hcl
use_localstack = true
bucket_name    = "course-local-yourname"
```

## Задание 5. Логи LocalStack при ошибке

```bash
docker compose -f deploy/localstack/docker-compose.yml logs -f localstack
```

## Критерии успеха

- [ ] Health endpoint отвечает
- [ ] `terraform apply` создал bucket
- [ ] CLI загрузил и прочитал объект
- [ ] После `destroy` bucket исчез из `s3 ls`

## Остановка

```bash
docker compose -f deploy/localstack/docker-compose.yml down
```

(путь: `deploy/localstack/docker-compose.yml`)

Следующий урок: [07-tflocal.md](07-tflocal.md).
