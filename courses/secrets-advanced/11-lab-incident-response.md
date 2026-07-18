# 11. Лаба: incident response (симуляция)

## Цель лабы

Симулировать **утечку CI token** с policy `ci-read`: отозвать token, проследить capabilities, задокументировать шаги runbook. Audit device на dev-стенде **не** включаем (требует перезапуска и путей в контейнере) — анализируем **концептуальный** лог и команды, которые вы бы выполнили в prod.

## Предварительно

- [10. Troubleshooting и audit](10-troubleshooting-audit.md)
- Выполнена [08-lab-approle](08-lab-approle.md) (policy `ci-read`, AppRole `ci-lab`)

```bash
export VAULT_ADDR=http://localhost:8200
export VAULT_TOKEN=course
```

---

## Сценарий

«В лог GitLab CI случайно напечатали `VAULT_TOKEN` job'а. Token имел policy `ci-read`. Подозрение: злоумышленник мог прочитать `secret/course/ci-demo` и попытаться эскалации.»

---

## Задание 1. Воспроизведите «утечку»

Создайте новый CI token (как в лабе 08):

```bash
ROLE_ID=$(vault read -field=role_id auth/approle/role/ci-lab/role-id)
SECRET_ID=$(vault write -field=secret_id -f auth/approle/role/ci-lab/secret-id)
LEAKED=$(vault write -field=token auth/approle/login role_id="$ROLE_ID" secret_id="$SECRET_ID")
echo "LEAKED=$LEAKED"
```

Сохраните в файл `/tmp/vault-ir-lab/leaked-token.txt` (симуляция попадания в лог).

---

## Задание 2. Оценка blast radius

```bash
vault token lookup "$LEAKED"
vault token capabilities "$LEAKED" secret/data/course/ci-demo
vault token capabilities "$LEAKED" sys/auth/approle
vault token capabilities "$LEAKED" pki/issue/lab-server
```

Запишите таблицу:

| Path | allow? |
|------|--------|
| `secret/data/course/ci-demo` | |
| `sys/auth/approle` | |
| `pki/issue/lab-server` | |

**Критерий:** понимаете, что **нельзя** выдать PKI без отдельной policy.

---

## Задание 3. Containment

```bash
vault token revoke "$LEAKED"
vault token lookup "$LEAKED"
```

**Ожидание:** lookup error / revoked.

Отзовите все активные secret_id (опционально):

```bash
vault write auth/approle/role/ci-lab/secret-id-accessor/destroy secret_id_accessor=$(vault write -field=secret_id_accessor -f auth/approle/role/ci-lab/secret-id)
```

(Если accessor недоступен — сгенерируйте новый `secret_id` и убедитесь, что старый исчерпал uses.)

---

## Задание 4. Runbook (письменно)

Создайте `/tmp/vault-ir-lab/runbook.md` (5–10 шагов):

1. Confirm leak scope (token lookup)
2. Revoke token / accessor
3. Rotate affected secrets (что меняете в `secret/course/ci-demo`?)
4. Review audit (в prod: SIEM query по accessor)
5. Fix CI (masked → OIDC → Vault AppRole + wrapping)
6. Post-mortem

Сошлитесь на [linux-security/07-secrets-disk](../linux-security/07-secrets-disk.md): почему токен не должен попадать в artifact.

---

## Задание 5. Усиление (опционально)

- Уменьшите `token_ttl` role `ci-lab` до `5m`.
- Добавьте `token_bound_cidrs` (если знаете IP runner).
- Сравните с [aws-intermediate/12-lab-secrets-kms](../aws-intermediate/12-lab-secrets-kms.md): ротация секрета в AWS после инцидента.

---

## Критерии успеха

- [ ] Token отозван, lookup показывает revoke
- [ ] Таблица capabilities заполнена
- [ ] Runbook готов для интервью («расскажите про incident с Vault»)
- [ ] Названы 2 меры предотвращения повторения

Следующий урок: [12. Interview Q&A](12-interview-qa.md).
