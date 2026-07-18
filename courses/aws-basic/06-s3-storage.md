# 06. S3: объектное хранилище

## Модель данных

**S3 (Simple Storage Service)** хранит **объекты** (файлы) в **bucket** — не файловую систему с папками, а плоское key-value хранилище с префиксами в ключах.

```text
s3://my-course-bucket/
    uploads/2024/photo.jpg   ← key = "uploads/2024/photo.jpg"
    data/report.csv
```

- Имя bucket **глобально уникально** во всём AWS.
- Bucket привязан к **region** при создании.
- Размер объекта: от 0 байт до **5 TB** (multipart upload для больших).

## Основные операции API

| Операция | API | Terraform |
|---|---|---|
| Создать bucket | `CreateBucket` | `aws_s3_bucket` |
| Загрузить файл | `PutObject` | `aws_s3_object` |
| Скачать | `GetObject` | — |
| Список | `ListObjectsV2` | `aws s3 ls` |
| Удалить | `DeleteObject` | — |

## Классы хранения

| Класс | Когда |
|---|---|
| **Standard** | Частый доступ |
| **Standard-IA** | Редкий доступ, дешевле хранение |
| **Glacier** | Архив, восстановление минуты–часы |
| **Intelligent-Tiering** | Авто-переход по паттерну доступа |

Для курса и dev — **Standard** достаточно.

## Версионирование и lifecycle

- **Versioning** — каждая перезапись создаёт новую версию объекта (защита от случайного delete).
- **Lifecycle rules** — переход в Glacier, удаление старых версий через N дней.

## Безопасность

| Механизм | Описание |
|---|---|
| **Block Public Access** | Account/bucket level — запрет публичного доступа (включайте по умолчанию) |
| **Bucket policy** | JSON на bucket (cross-account, CloudFront OAC) |
| **ACL** | Legacy, избегайте |
| **Encryption** | SSE-S3, SSE-KMS, SSE-C |
| **IAM policy** | Кто может `s3:GetObject` на какой prefix |

Типичная утечка: `Principal: "*"` в bucket policy + отключён Block Public Access.

## Presigned URL

Временная ссылка на `GetObject` / `PutObject` без выдачи IAM ключей клиенту:

```text
Backend (IAM role) → генерирует presigned URL (15 min)
    → Browser загружает файл напрямую в S3
```

Паттерн для загрузки картинок в финальном проекте курса Terraform.

## S3 и веб

- Статический сайт: `index.html` + website hosting (legacy; чаще **CloudFront + S3**).
- **CORS** — если браузер ходит в API и S3 с другого origin.

## Event notifications

S3 может слать события при `s3:ObjectCreated:*`:

```text
S3 (новый файл uploads/*.jpg)
    → Event notification → SQS / Lambda / EventBridge
```

Основа pipeline «загрузили картинку → Lambda ресайзит».

## Локальная эмуляция

LocalStack / MiniStack поддерживают S3 на `http://localhost:4566`. В Terraform — `endpoints { s3 = "..." }` или `tflocal`.

Ограничения эмулятора: не все edge cases (replication, Object Lock) как в production.

## Чек-лист

- Почему имя bucket уникально глобально?
- Чем bucket policy отличается от IAM policy?
- Зачем Block Public Access?
- Как S3 триггерит Lambda?
- Что такое presigned URL?

Следующий урок: [07-databases.md](07-databases.md).
