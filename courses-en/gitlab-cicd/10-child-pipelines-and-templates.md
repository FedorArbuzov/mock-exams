# 10. Child pipelines and templates

## Real-world scenario (interview answer)

> Parent pipeline is the **quality gate and orchestrator**.  
> Child pipelines are reusable **build** and **deploy** delivery units.  
> The same deploy child serves review, staging, and production via variables.

That split is what people mean when they ask about **child / downstream pipelines** — not “extra YAML for fun”.

## `include` vs `trigger` (child)

| Mechanism | Result | Use |
|---|---|---|
| `include:` | Same pipeline, merged YAML | templates, hidden jobs, shared rules |
| `trigger: include:` | **New** downstream pipeline | build factory / deploy continuum |

```yaml
# parent .gitlab-ci.yml
stages: [gate, trigger]

lint:
  stage: gate
  # …

trigger-build:
  stage: trigger
  needs: [lint, unit]
  trigger:
    include:
      - local: ci/build.gitlab-ci.yml
    strategy: depend

trigger-deploy:
  stage: trigger
  needs: [trigger-build]
  trigger:
    include:
      - local: ci/deploy.gitlab-ci.yml
    strategy: depend
  variables:
    PIPELINE_KIND: review   # or staging / production via rules
```

`strategy: depend` — parent fails if the child fails (what you want in interviews and in real gates).

## Templates

```yaml
# ci/.base.yml
.default_tags:
  tags: [docker]

.deploy_template:
  extends: [.default_tags]
  image:
    name: bitnami/kubectl:1.29
    entrypoint: [""]
  before_script:
    - kubectl version --client
```

Parent and children `include` local template files. Keep `.gitlab-ci.yml` thin.

## Passing the image to deploy

Prefer:

1. Convention: deploy always uses `$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA`, or  
2. dotenv from build child + forward variables into the deploy trigger.

## Reliability knobs (use in the final project)

| Knob | Where |
|---|---|
| `interruptible: true` | gate/test jobs |
| `timeout` / `retry` | build or deploy |
| `resource_group` | production |

## Checklist

- [ ] One-sentence difference: include vs child trigger  
- [ ] Why `strategy: depend`  
- [ ] Parent does not `kubectl apply` itself  

## Next

[11 — Lab: parent orchestrator](11-lab-orchestrator.md)
