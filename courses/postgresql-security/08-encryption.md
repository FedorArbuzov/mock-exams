# 08. Шифрование

## Сценарий с работы

Pen-test: трафик app→DB в plain text внутри VPC («мы доверяем сети»). Отдельно — украденный EBS snapshot без encryption — полный PGDATA readable. Compliance требует **in transit** и **at rest** — разные механизмы, оба обязательны.

PostgreSQL community **не** имеет native TDE (transparent data encryption) как Oracle/SQL Server — at rest = **диск / облако / backup**, не `CREATE TABLE ... ENCRYPTED`.

## Что вы узнаете

- TLS для клиентов (`sslmode`)
- Encryption at rest: disk, backup, column
- `pgcrypto` — когда уместен
- RDS / managed patterns

## In transit (TLS)

Сервер:

```ini
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'
ssl_min_protocol_version = 'TLSv1.2'
```

pg_hba:

```text
hostssl  all  all  10.0.0.0/8  scram-sha-256
```

Клиент — уровни `sslmode`:

| sslmode | Проверка | Когда |
|---------|----------|-------|
| `disable` | Нет TLS | **Никогда** prod |
| `require` | TLS, без проверки cert | Лучше чем disable |
| `verify-ca` | CA trusted | Staging |
| `verify-full` | CA + hostname match | **Production** |

```bash
psql "postgresql://app@db:5432/course?sslmode=verify-full&sslrootcert=/certs/ca.crt"
```

TLS шифрует **все** данные запроса/ответа после handshake. SCRAM защищает только пароль при auth — **не заменяет TLS**.

См. лабу [09-lab-ssl](09-lab-ssl.md), [`examples/ssl/README.md`](examples/ssl/README.md).

## At rest — уровни

```text
Column (pgcrypto)     ← редко, ключи в Vault
    ↑
Application encrypt   ← до записи в PG
    ↑
PostgreSQL PGDATA     ← файлы на диске
    ↑
Block storage         ← LUKS, EBS encrypted, encrypted PVC
    ↑
Backups (S3)          ← SSE-KMS, IAM
```

| Уровень | Реализация | Кто управляет |
|---------|------------|---------------|
| Disk | LUKS, EBS encryption, CMEK | Cloud / OS team |
| PVC (K8s) | StorageClass encrypted | Platform |
| Backup | S3 SSE-KMS, cross-account deny public | DBA + Security |
| Column | `pgp_sym_encrypt` | App + Vault |

## pgcrypto (column-level)

```sql
CREATE EXTENSION pgcrypto;

INSERT INTO sec.secrets (payload)
VALUES (pgp_sym_encrypt('PAN-4111...', current_setting('app.encrypt_key')));

SELECT pgp_sym_decrypt(payload::bytea, 'key') FROM sec.secrets;
```

Минусы:

- Ключ в `current_setting` — утечка через logs
- Нет index на plaintext
- Rotation ключей сложна

Предпочтительнее: encrypt в app ([secrets-basic](../secrets-basic/README.md)) или tokenization (PCI).

## RDS / managed

| Сервис | At rest | In transit |
|--------|---------|------------|
| AWS RDS | Enable at create (нельзя позже) | `rds-ca-2019-root.pem`, `verify-full` |
| Aurora | Same | Same |
| Cloud SQL | Google-managed keys | SSL required |

См. [aws-intermediate](../aws-intermediate/README.md).

## verify-full в K8s

```yaml
volumeMounts:
  - name: db-ca
    mountPath: /etc/ssl/certs/db-ca.crt
    subPath: ca.crt
env:
  - name: DATABASE_URL
    value: "...?sslmode=verify-full&sslrootcert=/etc/ssl/certs/db-ca.crt"
```

CA Secret — от platform team; rotation без downtime при dual-CA.

## Типичные ошибки

1. `sslmode=require` без проверки cert — MITM возможен.
2. EBS encryption off «для performance» — snapshot = breach.
3. Backup bucket без SSE — копия PGDATA в clear.
4. pgcrypto с ключом в миграции SQL в git.
5. «VPC private» = не нужен TLS — defense in depth.

## Чек-лист

- [ ] hostssl + verify-full в prod target
- [ ] At rest: disk + backup encrypted
- [ ] CA rotation process
- [ ] pgcrypto только с ключом из Vault
- [ ] RDS encryption at create

## Дальше

Лаба SSL: [09-lab-ssl.md](09-lab-ssl.md).
