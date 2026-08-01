# 03. Stages, needs, workflow, rules

## Real-world scenario

Every push rebuilds a huge Docker image. Feedback is slow and runners are busy. You need **fail-fast**, **MR-only** cheap jobs, and expensive jobs only when gates pass.

## Stages vs `needs`

**Stages** define the default order. **`needs`** builds a DAG: a job can start as soon as its dependencies finish — even if other jobs in an earlier stage are still running (depending on version/settings). More importantly, `needs` documents dependencies and skips wasted work when a dependency failed.

```yaml
stages:
  - validate
  - test
  - build

lint:
  stage: validate
  script: ["echo lint"]

unit:
  stage: test
  script: ["echo test"]

docker-build:
  stage: build
  needs: [lint, unit]
  script: ["echo build"]
```

If `lint` fails, `docker-build` should not run (with normal `needs`).

## `workflow:rules` (pipeline existence)

Controls whether a pipeline is created at all:

```yaml
workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
```

Feature branch pushes **without** an MR → no pipeline (saves runners).

## Job `rules`

Controls each job:

```yaml
deploy-prod:
  stage: deploy
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
      when: manual
    - when: never
  script: ["kubectl apply -f k8s/"]
```

Typical split:

| Event | validate/test | build | review deploy | staging | prod |
|---|---|---|---|---|---|
| MR | yes | yes | yes | no | no |
| `main` | yes | yes | no | auto | manual |

## Prefefined variables (know these)

| Variable | Meaning |
|---|---|
| `CI_COMMIT_SHA` | immutable image tag |
| `CI_COMMIT_REF_SLUG` | DNS-safe branch name |
| `CI_REGISTRY_IMAGE` | project registry path |
| `CI_PIPELINE_SOURCE` | `merge_request_event`, `push`, … |

## Checklist

- [ ] Stages vs `needs` — one sentence each  
- [ ] Why `workflow:rules` beats “run everything on every push”  
- [ ] Prod is `when: manual` on default branch only  

## Next

[04 — Lab: DAG pipeline](04-lab-dag-pipeline.md)
