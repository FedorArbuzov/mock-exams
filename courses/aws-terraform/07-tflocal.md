# 07. tflocal: один код для local и prod

## Проблема

В `.tf` не хочется дублировать блок `endpoints { ... }` и `skip_*` — в production их быть не должно.

## Решение: terraform-local

Пакет **[terraform-local](https://github.com/localstack/terraform-local)** устанавливает CLI **`tflocal`**, который:

1. Оборачивает вызов `terraform`.
2. Подставляет переменные окружения и **сгенерированный** `localstack_providers_override.tf` с endpoints.
3. Ваши `.tf` остаются «чистыми» для AWS.

```bash
pip install terraform-local
```

## Использование

```bash
# LocalStack должен быть запущен
tflocal init
tflocal plan
tflocal apply
tflocal destroy
```

Эквивалент `terraform` с автонастройкой под `http://localhost:4566`.

## Provider без endpoints в репозитории

Для курса с `tflocal` достаточно:

```hcl
provider "aws" {
  region = var.aws_region
}
```

`tflocal` добавит override при запуске.

Для **реального AWS**:

```bash
export AWS_PROFILE=dev
terraform apply
```

## Сравнение подходов

| Подход | Когда |
|---|---|
| `endpoints` в provider | Явный контроль, MiniStack, CI без tflocal |
| `tflocal` | Быстрые лабы, меньше boilerplate |
| `use_localstack` variable | Один репозиторий, переключение tfvars |

В этом курсе используем **оба**: понимаете endpoints (урок 05–06) и `tflocal` (урок 07–08).

## .gitignore

```
.terraform/
*.tfstate
*.tfstate.*
.terraform.lock.hcl
localstack_providers_override.tf
```

Последний файл создаёт `tflocal` — не коммитьте.

## Чек-лист

- Что делает `tflocal` под капотом?
- Почему override-файл в `.gitignore`?
- Как применить тот же код в prod без tflocal?

Следующий урок: [08-lab-tflocal.md](08-lab-tflocal.md).
