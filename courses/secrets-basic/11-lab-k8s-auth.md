# 11. Лаба: Kubernetes auth — tabletop и optional mockctl

## Цель лабы

Разобрать **Vault Kubernetes role** из [`examples/k8s-auth-role.json`](examples/k8s-auth-role.json), сопоставить с ServiceAccount из [kuber-basic/12](../kuber-basic/12-config-and-secret.md), выполнить **tabletop** login flow. Опционально: включить `kubernetes` auth на `mockctl` кластере.

## Предварительно

- [10. Vault и Kubernetes](10-kubernetes-vault.md), policy `course-readonly`.
- Файл role: [`examples/k8s-auth-role.json`](examples/k8s-auth-role.json).

---

## Часть A — Tabletop (обязательно)

### Задание 1. Прочитать role JSON

Откройте `examples/k8s-auth-role.json`. Заполните таблицу:

| Поле | Значение в файле | Смысл |
|------|------------------|--------|
| `bound_service_account_names` | | какой SA допущен |
| `bound_service_account_namespaces` | | в каком namespace |
| `policies` | | какие Vault policies |
| `ttl` / `max_ttl` | | время жизни token |

**Что увидите:** привязка `checkout-app` в namespace `checkout` к policy `course-readonly`, TTL 1h (max 24h).

---

### Задание 2. Манифест SA (на бумаге)

Набросайте фрагмент Deployment (не применяйте без кластера):

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: checkout-app
  namespace: checkout
---
spec:
  serviceAccountName: checkout-app
  containers:
    - name: app
      image: my-checkout:1.0
      # env из Vault Agent file — не hardcode password
```

Сверьте с [kuber-basic/12](../kuber-basic/12-config-and-secret.md).

---

### Задание 3. Login flow (текстом)

Опишите 5 шагов: Pod стартует → … → `vault kv get secret/course/checkout/db`.

**Критерий:** упомянуты JWT path `/var/run/secrets/kubernetes.io/serviceaccount/token`, `auth/kubernetes/login`, role name `checkout-app`.

---

### Задание 4. Негативные кейсы

| Сценарий | Ожидание |
|----------|----------|
| SA `default` в `checkout` | login denied |
| SA `checkout-app` в `kube-system` | login denied |
| Role TTL истёк | 403, Agent renew |

---

## Часть B — mockctl (опционально)

Требуется: `mockctl up`, `kubectl`, Vault на хосте `localhost:8200`.

### Задание 5. Namespace и SA

```bash
kubectl create namespace checkout
kubectl -n checkout create serviceaccount checkout-app
```

---

### Задание 6. Enable kubernetes auth (admin)

```bash
export VAULT_ADDR=http://localhost:8200 VAULT_TOKEN=course
vault auth enable kubernetes 2>/dev/null || true
# kubernetes_host и reviewer JWT — см. документацию Vault для вашего кластера
# Упрощённо для lab: используйте официальный guide под mockctl API endpoint
```

> Если конфиг API недоступен — остановитесь на части A; зачтите лабу по tabletop.

---

### Задание 7. Записать role

```bash
vault write auth/kubernetes/role/checkout-app \
  bound_service_account_names=checkout-app \
  bound_service_account_namespaces=checkout \
  policies=course-readonly \
  ttl=1h max_ttl=24h
```

---

### Задание 8. Test pod (curl job)

```bash
kubectl -n checkout run vault-test --rm -it --restart=Never \
  --serviceaccount=checkout-app \
  --image=curlimages/curl:8.7.1 --command -- sleep 300
```

Из Pod (tabletop command, если сеть до Vault с кластера настроена):

```bash
JWT=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
curl -s --request POST \
  --data "{\"role\":\"checkout-app\",\"jwt\":\"$JWT\"}" \
  "$VAULT_ADDR/v1/auth/kubernetes/login"
```

**Что увидите:** JSON с `auth.client_token` при успешной настройке; иначе — зафиксируйте ошибку в отчёте (часто network/DNS до host Vault).

---

## Критерии успеха

- [ ] Таблица role JSON заполнена
- [ ] Deployment + SA согласованы с bound fields
- [ ] 5 шагов login flow описаны
- [ ] Три негативных кейса задокументированы
- [ ] (Optional) role записана в Vault / test login attempted

## Что унести в работу

- **Bound** SA + namespace — главный guardrail K8s auth
- Не монтировать root Vault token в Pod
- Для локальной разработки — отдельный dev role и path `course/dev/…`

Следующий урок: [12. Сравнение менеджеров](12-comparison-managers.md).
