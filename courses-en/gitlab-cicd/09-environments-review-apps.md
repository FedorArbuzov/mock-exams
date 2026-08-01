# 09. Environments and review apps

## Environments

GitLab **Environments** track deployments and URLs:

```yaml
deploy-staging:
  environment:
    name: staging
    url: http://localhost:8080/staging/
  script: ["…"]
```

| Environment | When | Behavior |
|---|---|---|
| `review/<slug>` | MR | auto deploy + stop job |
| `staging` | `main` | auto |
| `production` | `main` | `when: manual`, protected, `resource_group` |

```yaml
deploy-prod:
  environment:
    name: production
    url: http://localhost:8080/prod/
  resource_group: production
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
      when: manual
```

`resource_group` serializes prod deploys so two pipelines do not fight.

## Review apps (path-based on this stand)

For MR branch `feature/foo`, slug ≈ `feature-foo`:

| Piece | Value |
|---|---|
| Namespace | `review-feature-foo` |
| Ingress path | `/r/feature-foo/` |
| Environment URL | `http://localhost:8080/r/feature-foo/` |

Requires Ingress + [`mockctl` LB](../../mockctl/README.md) on `:8080`. Prefer Ingress **without** a host so `localhost` works.

```yaml
deploy-review:
  environment:
    name: review/$CI_COMMIT_REF_SLUG
    url: http://localhost:8080/r/$CI_COMMIT_REF_SLUG/
    on_stop: stop-review
    auto_stop_in: 1 day
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

`stop-review` deletes the namespace (`when: manual` and/or stop action from the Environment UI).

## Why path, not subdomain

Locally, `*.review.local` needs hosts/DNS per branch. Path prefix shares one LB and one Ingress controller — good enough for the course and clear in demos.

## Checklist

- [ ] Staging vs production rules  
- [ ] Review URL formula  
- [ ] Cleanup via `on_stop`  

## Next

[10 — Child pipelines and templates](10-child-pipelines-and-templates.md)
