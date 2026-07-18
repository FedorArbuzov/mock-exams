# 09. Лаба: tabletop CI — Vault KV для deploy secret

## Цель лабы

Подготовить секрет `secret/course/checkout/deploy`, эмулировать **fetch job** и **deploy job** shell-скриптами (без GitLab Runner), сверить с [`examples/gitlab-vault-snippet.yml`](examples/gitlab-vault-snippet.yml).

## Предварительно

- Vault up, policy `course-readonly` и умение создать readonly token ([05](05-lab-policies.md)).
- `jq` на хосте (Git Bash/WSL) или парсинг вручную.

```bash
V="docker exec -e VAULT_ADDR=http://127.0.0.1:8200 -e VAULT_TOKEN=course mock-vault vault"
```

---

## Задание 1. Записать deploy secret

```bash
$V kv put secret/course/checkout/deploy \
  api_key='sk-deploy-lab-7f3a' registry_user=ci-checkout env=staging
```

**Что увидите:** `Success! Data written to: secret/data/course/checkout/deploy`.

---

## Задание 2. Readonly token для «CI»

```bash
$V token create -policy=course-readonly -ttl=1h -display-name=ci-tabletop -format=json \
  | tee /tmp/ci-token.json
```

Сохраните `client_token` как `CI_TOKEN`.

---

## Задание 3. Fetch job (эмуляция)

```bash
docker exec -e VAULT_TOKEN="$CI_TOKEN" mock-vault \
  vault kv get -format=json secret/course/checkout/deploy \
  > deploy-secret.json

wc -c deploy-secret.json
```

**Что увидите:** файл > 200 байт, JSON с `data.data.api_key`.

---

## Задание 4. Deploy job — использовать, не печатать

```bash
jq -r '.data.data.api_key' deploy-secret.json | wc -c
jq -r '.data.data.env' deploy-secret.json
```

**Что увидите:** длина ключа > 10; `staging`. **Не** запускайте `cat deploy-secret.json` в shared screen.

---

## Задание 5. Негатив: write из CI token

```bash
docker exec -e VAULT_TOKEN="$CI_TOKEN" mock-vault \
  vault kv put secret/course/checkout/deploy api_key=hacked || true
```

**Что увидите:** permission denied.

---

## Задание 6. Cleanup и revoke

```bash
docker exec -e VAULT_TOKEN="$CI_TOKEN" mock-vault vault token revoke -self
rm -f deploy-secret.json /tmp/ci-token.json
```

---

## Задание 7. Сопоставление со snippet (опционально)

Откройте [`examples/gitlab-vault-snippet.yml`](examples/gitlab-vault-snippet.yml). Отметьте:

- какой stage соответствует заданию 3;
- где artifact;
- что добавить в `after_script` для revoke (tabletop: задание 6).

---

## Задание 8. GitLab (опционально)

Если есть GitLab: создайте masked variables `VAULT_ADDR`, `VAULT_TOKEN` (readonly), вставьте snippet в test project, запустите pipeline на protected branch.

---

## Критерии успеха

- [ ] KV `secret/course/checkout/deploy` создан
- [ ] Fetch с readonly token → `deploy-secret.json`
- [ ] `jq` извлекает `env` без вывода `api_key` в консоль
- [ ] Put с CI token denied
- [ ] Token revoked, файл удалён

## Что унести в работу

- Паттерн **two-stage** fetch/deploy
- Readonly policy для CI
- Revoke + удаление artifact как hygiene

Следующий урок: [10. Vault и Kubernetes](10-kubernetes-vault.md).
