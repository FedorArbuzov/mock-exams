# 13. Лаба: минимальный оператор Tenant

> Требует Go 1.21+, ~4 ГБ RAM. Полная сборка — 30–60 мин. Можно пройти теорию [12-operators.md](12-operators.md) и пропустить hands-on.

## Быстрый путь (без написания кода)

Установите готовый оператор для практики reconcile:

```bash
# Пример: nginx ingress operator уже в кластере после mockctl up
kubectl get crd | grep nginx
```

Или используйте CRD `Tenant` из [intermediate/24-lab-crd.md](../kuber-intermediate/24-lab-crd.md) и **вручную** выполняйте действия оператора:

```bash
kubectl apply -f tenant.yaml    # Tenant alice
kubectl create namespace tenant-alice
kubectl patch tenant alice --subresource=status -p '{"status":{"phase":"Active"}}'
```

## Полный путь (kubebuilder)

```bash
# На хосте с Go:
kubebuilder init --domain example.com --repo example.com/mock-operator
cd mock-operator
kubebuilder create api --group example --version v1 --kind Tenant
# Отредактировать controllers/tenant_controller.go:
#   Reconcile: при Tenant → ensure Namespace named tenant-<metadata.name>
make install && make run
```

В другом терминале:

```bash
kubectl apply -f config/samples/example_v1_tenant.yaml
kubectl get namespaces | grep tenant
```

## Вопросы

1. Что делает reconcile при создании Tenant?
2. Почему controller пишет в status через subresource?
