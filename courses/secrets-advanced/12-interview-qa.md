# 12. Interview Q&A — топ-25 вопросов с ответами

Формат: **вопрос** → **короткий ответ** (30 с) → **deep dive** (2–3 мин). Таблица: [`interview-cheatsheet.md`](interview-cheatsheet.md).

---

## Архитектура Vault

### 1. Зачем Vault, если есть Kubernetes Secrets?

**Коротко:** K8s Secret — base64 в etcd; нет динамической ротации, audit, централизованных policies.

**Deep dive:** External Secrets / CSI + Vault; short-lived DB creds; encryption at rest etcd ≠ защита от insider. См. [kuber-basic Secret](../kuber-basic/12-config-and-secret.md).

### 2. Что такое secrets engine?

**Коротко:** Плагин mount (`kv/`, `pki/`, `transit/`) с API и storage semantics.

**Deep dive:** Auth method ≠ engine; path `secret/data/x` vs `pki/issue/role`.

### 3. KV v1 vs v2?

**Коротко:** v2 — версии, metadata, `destroy`, check-and-set.

**Deep dive:** Path `secret/data/` vs `secret/`; soft delete; [secrets-basic](../secrets-basic/README.md).

### 4. Dev mode опасности?

**Коротко:** In-memory, известный root, auto-unseal — только лаб.

**Deep dive:** [09](09-ha-raft-unseal.md), [deploy/vault](../../deploy/vault/README.md).

### 5. Seal vs unseal?

**Коротко:** Sealed — storage зашифрован, API ограничен; unseal восстанавливает master key в RAM.

**Deep dive:** Shamir M-of-N; auto-unseal KMS; reboot → sealed без auto-unseal.

---

## PKI

### 6. Зачем PKI engine, а не openssl в CI?

**Коротко:** Policy, TTL, audit, CRL, централизованный CA.

**Deep dive:** [01](01-pki-overview.md); role `allowed_domains`; issue vs sign.

### 7. Issue vs sign?

**Коротко:** Issue — Vault генерирует key; sign — клиент приносит CSR, key локально.

**Deep dive:** Compliance PCI — предпочтение sign; [02-lab](02-lab-pki-issue-cert.md).

### 8. Как запретить cert на чужой домен?

**Коротко:** `allowed_domains`, без `allow_any_name`.

**Deep dive:** [`pki-role.json`](examples/pki-role.json); отдельные roles per team.

### 9. Ротация leaf vs intermediate?

**Коротко:** Leaf часто (дни); intermediate реже; root offline.

**Deep dive:** [03](03-rotation-renewal.md), dual chain, [rotation-checklist](examples/rotation-checklist.md).

### 10. Что даёт lease на cert?

**Коротко:** Автоматический учёт TTL; revoke через `vault lease revoke`.

**Deep dive:** CRL обновление; клиенты должны проверять отзыв.

---

## Transit и шифрование

### 11. Transit vs хранить ключ в приложении?

**Коротко:** KEK в Vault; приложение хранит только ciphertext.

**Deep dive:** [05](05-transit-encryption.md); compare [AWS KMS](../aws-intermediate/11-secrets-kms.md).

### 12. Что означает `vault:v1:` в ciphertext?

**Коротко:** Версия ключа Transit для decrypt/rewrap.

**Deep dive:** rotate + `min_encryption_version`; lazy rewrap ([06-lab](06-lab-transit.md)).

### 13. Нужно ли перешифровать всю БД при rotate?

**Коротко:** Нет сразу — `rewrap` или при чтении.

**Deep dive:** Batch rewrap job; downtime planning.

---

## Auth и dynamic secrets

### 14. AppRole когда использовать?

**Коротко:** CI/VM без K8s SA; role_id + secret_id.

**Deep dive:** [07](07-dynamic-secrets-approle.md), [08-lab](08-lab-approle.md); prefer K8s auth in cluster.

### 15. Как доставлять secret_id безопасно?

**Коротко:** Wrapping, agent, masked CI — не в git/log.

**Deep dive:** `secret_id_num_uses`, TTL; [11-lab](11-lab-incident-response.md).

### 16. Dynamic database secret flow?

**Коротко:** Vault создаёт SQL user на TTL, потом удаляет.

**Deep dive:** Connection pool к Vault; max connections DB; rotation admin creds.

### 17. Root token в production?

**Коротко:** Нет routine use; revoke после init; break-glass only.

**Deep dive:** Generate root with quorum; audit alert.

---

## HA и ops

### 18. Raft quorum?

**Коротко:** Большинство нод для commit; обычно 3 или 5 servers.

**Deep dive:** [09](09-ha-raft-unseal.md); потеря 2 из 3 → недоступность write.

### 19. Auto-unseal trade-off?

**Коротко:** Удобный restart; зависимость от KMS/HSM.

**Deep dive:** Shamir backup; DR drill.

### 20. Audit обязателен?

**Коротко:** Да в prod для forensics и compliance.

**Deep dive:** [10](10-troubleshooting-audit.md); fail closed if disk full.

---

## Incident и сравнения

### 21. Утёк service token — шаги?

**Коротко:** Revoke → assess policy → rotate secrets → fix delivery → post-mortem.

**Deep dive:** [11-lab](11-lab-incident-response.md).

### 22. Vault vs AWS Secrets Manager?

**Коротко:** Vault — multi-cloud, PKI/Transit; ASM — native AWS, проще для Lambda.

**Deep dive:** [11-secrets-kms](../aws-intermediate/11-secrets-kms.md); hybrid common.

### 23. Где секрет всё ещё опасен после Vault?

**Коротко:** Память процесса, core dump, логи, `/tmp`, backup.

**Deep dive:** [07-secrets-disk](../linux-security/07-secrets-disk.md); agent templates 600.

### 24. Policy debugging?

**Коротко:** `vault token capabilities`; exact paths KV v2.

**Deep dive:** Deny by default; test with limited token.

### 25. Design: mTLS mesh 50 сервисов?

**Коротко:** Internal CA Vault, short TTL, cert-manager/agent, trust bundle rotation.

**Deep dive:** [13-capstone](13-capstone.md); intermediate rotation; monitoring expiry.

---

## Как тренироваться

1. Пройдите [`interview-cheatsheet.md`](interview-cheatsheet.md) вслух без подсказок.
2. На каждый вопрос нарисуйте **одну** диаграмму (PKI chain / Transit / AppRole login).
3. Свяжите ответ с **личной лабой** на `deploy/vault`.

Следующий шаг: [13. Capstone](13-capstone.md).
