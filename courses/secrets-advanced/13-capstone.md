# 13. Capstone: internal PKI + Transit + CI identity

## Цель проекта (4–6 часов)

Собрать **документированную** мини-платформу секретов на стенде [`deploy/vault`](../../deploy/vault/README.md): internal CA, шифрование поля PII через Transit, CI доступ через AppRole **без root**, runbook инцидента и ответ на design-вопрос — артефакт для портфолио и интервью.

## Предварительно

Пройдены главы **01–12** или эквивалент [secrets-basic](../secrets-basic/README.md) + этот README.

```bash
cd deploy/vault
docker compose up -d
bash scripts/init-engines.sh
export VAULT_ADDR=http://localhost:8200
export VAULT_TOKEN=course
```

---

## Часть A — PKI platform (90 мин)

1. Выпустите cert для `cap.lab.mock-exams.local` ([02-lab](02-lab-pki-issue-cert.md)) — сохраните PEM в `examples/capstone/` (локально, **не** в git).
2. Заполните [`examples/rotation-checklist.md`](examples/rotation-checklist.md) для этого cert.
3. Симулируйте ротацию: второй issue + revoke первого lease ([04-lab](04-lab-cert-rotation.md)).
4. Документ `examples/capstone/pki-design.md` (1 страница):
   - root vs intermediate (даже если на стенде один уровень)
   - TTL leaf и алерты
   - issue vs sign — ваш выбор для «продукта»

**Deliverable:** `pki-design.md` + заполненный чек-лист.

---

## Часть B — Transit для PII (60 мин)

1. Ключ `capstone-pii`, encrypt JSON `{"email":"user@example.com"}`.
2. Rotate + rewrap ([06-lab](06-lab-transit.md)).
3. В `examples/capstone/transit-notes.md` опишите:
   - где хранится ciphertext (таблица `users.encrypted_email`)
   - кто имеет policy encrypt-only vs decrypt
   - сравнение с [aws-intermediate/11-secrets-kms](../aws-intermediate/11-secrets-kms.md) в 1 абзаце

**Deliverable:** `transit-notes.md` + пример ciphertext (можно redacted).

---

## Часть C — CI identity (60 мин)

1. Policy `capstone-ci`: read `secret/data/course/capstone/*`, **нет** доступа к `pki/issue`, `transit/decrypt`.
2. AppRole `capstone-deploy` + login без root.
3. Положите секрет: `vault kv put secret/course/capstone/config api_key=demo`.
4. Проверьте deny на `vault write pki/issue/lab-server ...` с CI token.

**Deliverable:** HCL policy в `examples/capstone/ci-policy.hcl` + 5 строк «как доставить secret_id в GitLab» ([gitlab-basic/07](../gitlab-basic/07-variables-secrets.md)).

---

## Часть D — Incident runbook (45 мин)

По шаблону [11-lab](11-lab-incident-response.md) оформите `examples/capstone/incident-runbook.md`:

- утечка CI token capstone
- утечка root (теоретически)
- ссылка на [linux-security/07-secrets-disk](../linux-security/07-secrets-disk.md)

**Deliverable:** runbook 1–2 страницы.

---

## Часть E — Mock design interview (30 мин)

Письменно ответьте на вопрос **25** из [12-interview-qa](12-interview-qa.md): mTLS mesh 50 сервисов.

Структура ответа:

1. Trust model (internal CA)
2. Issuance automation (agent / cert-manager)
3. Rotation и blast radius
4. Observability (expiry metrics)
5. Что **не** кладёте в Vault (бизнес-данные — только keys/certs)

**Deliverable:** `examples/capstone/design-mtls.md`.

---

## Критерии приёмки (самопроверка)

| Область | Проверка |
|---------|----------|
| PKI | cert verify OK; чек-лист заполнен |
| Transit | rotate/rewrap без потери decrypt |
| CI | root не нужен; least privilege |
| Ops | runbook применим |
| Interview | design doc читается за 5 мин |

---

## Что сказать на собеседовании

«Я поднял Vault dev стенд, развернул PKI и Transit через init-engines, выдал mTLS cert с role constraints, зашифровал PII поле через Transit с key rotation, CI завёл через AppRole с ограниченной policy и описал incident runbook. Понимаю, почему dev mode не переносится в prod: Raft, auto-unseal, audit.»

---

## Дальше

- Пройдите [12-interview-qa](12-interview-qa.md) и [interview-cheatsheet](interview-cheatsheet.md) без подсказок.
- [secrets-basic](../secrets-basic/README.md) — если пропускали фундамент.
- Production: Helm chart Vault, cert-manager issuer, Terraform provider.
