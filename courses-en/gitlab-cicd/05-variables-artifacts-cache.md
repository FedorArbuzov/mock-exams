# 05. Variables, artifacts, cache

## Variables

| Kind | Where | Use |
|---|---|---|
| Prefefined | GitLab | `CI_*` |
| Project CI/CD Variables | Settings → CI/CD | secrets, kubeconfig |
| YAML `variables:` | `.gitlab-ci.yml` | non-secret defaults |

**Never commit secrets.** Prefer **Masked** + **Protected** for tokens. For kubeconfig use type **File** (path appears in `$KUBECONFIG`).

## Artifacts

Pass files between jobs (reports, wheels, dotenv):

```yaml
unit:
  script: ["pytest --junitxml=report.xml"]
  artifacts:
    when: always
    paths: [report.xml]
    expire_in: 1 week

build:
  needs:
    - job: unit
      artifacts: true
```

**dotenv** artifact — small `KEY=value` file for downstream jobs (e.g. `IMAGE=`).

## Cache

 Speeds dependency installs; **not** a substitute for artifacts:

```yaml
cache:
  key:
    files: [requirements-dev.txt]
  paths: [.cache/pip]
```

## Checklist

- [ ] File variable vs ordinary variable  
- [ ] Artifact vs cache in one sentence  
- [ ] Why masked secrets can still leak via `echo` in logs  

## Next

[06 — Build and Container Registry](06-build-and-registry.md)
