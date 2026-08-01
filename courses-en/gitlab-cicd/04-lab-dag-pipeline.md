# 04. Lab: DAG pipeline

## Goal

Extend `.gitlab-ci.yml` with `workflow:rules`, three stages, and a stub `build` job that `needs` lint + unit.

## Tasks

1. Add:

```yaml
stages:
  - validate
  - test
  - build

workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
```

2. Move lint → `validate`, unit → `test`.  
3. Add stub:

```yaml
build-stub:
  stage: build
  tags: [docker]
  image: alpine:latest
  needs: [lint, unit]
  script:
    - echo "Would build $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
```

(Rename jobs if needed so `needs` matches real job names.)

4. Push a **feature branch without MR** — confirm no pipeline (or only what your workflow allows).  
5. Open MR — pipeline runs; break `lint` and confirm `build-stub` does not succeed afterward.

## Check

- [ ] Pipeline graph shows `needs` edge into build  
- [ ] Failed lint skips/fails the build path  
- [ ] `workflow` behavior matches the table in [03](03-needs-workflow-rules.md)

## Next

[05 — Variables, artifacts, cache](05-variables-artifacts-cache.md)
