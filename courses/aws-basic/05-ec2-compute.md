# 05. EC2: виртуальные серверы

## Что такое EC2

**EC2 (Elastic Compute Cloud)** — виртуальные машины в AWS. Вы выбираете **тип инстанса**, **AMI** (образ ОС), **размер диска** и **сеть** (VPC, subnet, SG).

Это классический **IaaS**: вы патчите ОС, ставите Docker/k8s agent, настраиваете firewall (SG).

## Instance types (семейства)

Имя типа: `m5.large` = семейство `m5`, размер `large`.

| Префикс | Назначение | Пример |
|---|---|---|
| **t** | Burstable, дёшево, dev | `t3.micro` (Free Tier) |
| **m** | General purpose | `m5.xlarge` |
| **c** | CPU-оптимизированные | batch, компиляция |
| **r** | Memory-оптимизированные | кэши, in-memory DB |
| **g** / **p** | GPU | ML inference |

Размеры: `nano` < `micro` < `small` < `large` < `xlarge` …

## AMI и lifecycle

- **AMI** — образ диска (Amazon Linux, Ubuntu, Windows).
- **User data** — скрипт при первом boot (cloud-init): установка пакетов, join в кластер.
- **Instance store** — ephemeral диск на хосте (пропадает при stop); **EBS** — постоянный volume.

```text
Launch template / Launch configuration
    → AMI + instance type + subnet + SG + key pair
    → EC2 instance
```

## EBS volumes

| Тип | Характеристика |
|---|---|
| **gp3** | SSD general purpose (default) |
| **io2** | Высокий IOPS |
| **st1** | HDD throughput |

Volume **привязан к AZ**. Snapshot → можно создать volume в другой AZ/region.

## Ключи и доступ

- **Key pair** — SSH на Linux (приватный ключ только у вас).
- **SSM Session Manager** — SSH без открытого порта 22 (нужна IAM role на instance).

Production: предпочитайте SSM, не публичный SSH.

## Auto Scaling Group (ASG)

```text
ALB
  → Target Group
       → ASG (min=2, max=10, desired=2)
            → EC2 в 2 AZ
```

- **Scaling policy** — по CPU, custom metric, schedule.
- **Health check** — ALB + EC2 status; unhealthy → replace.

## Spot и Reserved (кратко)

| Модель | Суть |
|---|---|
| **On-Demand** | Платите по часам, без обязательств |
| **Reserved / Savings Plans** | Скидка за обязательство 1–3 года |
| **Spot** | До 90% дешевле, AWS может **прервать** инстанс |

Spot — для stateless workers, batch, CI agents.

## EC2 vs Lambda vs Containers

| Критерий | EC2 | Lambda | ECS/EKS |
|---|---|---|---|
| Управление ОС | Вы | AWS | Платформа / вы |
| Масштабирование | ASG | Авто | HPA / ASG |
| Долгие задачи | Да | Лимит времени | Да |
| Стоимость при простое | Да (если не stop) | Нет | Зависит |

## Чек-лист

- Чем AMI отличается от instance type?
- Зачем ASG и минимум 2 инстанса в 2 AZ?
- gp3 vs instance store?
- Когда Spot не подходит?
- Чем EC2 отличается от Lambda по модели оплаты?

Следующий урок: [06-s3-storage.md](06-s3-storage.md).
