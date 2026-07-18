# 08. Flux CD vs Argo CD

## Две экосистемы GitOps

| | **Argo CD** | **Flux CD** |
|---|-------------|-------------|
| Модель | Application CR (pull UI) | GitRepository + Kustomization/HelmRelease |
| UI | встроенный, богатый | Flux UI / Weave GitOps (опционально) |
| Multi-tenancy | AppProject | namespace-scoped controllers |
| Helm | встроен в Application | HelmRelease CR |
| Популярность | платформенные команды, визуализация | CNCF Graduated, GitOps Toolkit |

## Flux — минимальная схема

```text
GitRepository  →  ссылка на repo/branch
Kustomization  →  path + prune + target namespace
```

Примеры в репозитории (справочно, **не** ставить на тот же mockctl вместе с Argo без изоляции):

- [`examples/flux-gitrepository.yaml`](../../deploy/gitops/examples/flux-gitrepository.yaml)
- [`examples/flux-kustomization.yaml`](../../deploy/gitops/examples/flux-kustomization.yaml)

Установка Flux (отдельно):

```bash
flux install
flux create source git ...
flux create kustomization ...
```

## Когда что выбирать

| Ситуация | Частый выбор |
|----------|--------------|
| Нужен UI для SRE/on-call | Argo CD |
| Только controllers, GitOps Toolkit | Flux |
| Уже GitLab + split CI | оба работают; в mock-exams — **Argo** |

Стенд курса: **Argo CD** на mockctl ([`deploy/gitops`](../../deploy/gitops/README.md)).

## Чек-лист

- Чем Application Argo похож на Kustomization Flux?
- Почему два контроллера на одни namespace — плохая идея?

Следующий урок: [09-split-ci-cd.md](09-split-ci-cd.md).
