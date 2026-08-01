# 07. Lab: build and push

## Goal

Replace the build stub with a real image build + push to the GitLab registry tagged `$CI_COMMIT_SHA`.

## Tasks

1. Add a `Dockerfile` (use [`examples/k8s-deploy/Dockerfile`](examples/k8s-deploy/Dockerfile) or a multi-stage build for `hello-ci`).  
2. Implement `docker-build` as in [06](06-build-and-registry.md) (or Kaniko if you prefer).  
3. `needs: [lint, unit]` (or your validate/test job names).  
4. Run on MR or `main` — open **Deploy → Container Registry** and confirm the SHA tag.  
5. Optional: write a dotenv artifact:

```bash
echo "IMAGE=$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA" > build.env
```

```yaml
artifacts:
  reports:
    dotenv: build.env
```

## Check

- [ ] Image exists for this commit SHA  
- [ ] Failed tests prevent push (`needs`)  
- [ ] No password committed in YAML  

## Troubleshooting

| Problem | Hint |
|---|---|
| `Cannot connect to Docker daemon` | DinD / socket / privileged |
| `denied` on push | login variables; project registry enabled |
| Huge context | `.dockerignore` |

## Next

[08 — Deploy to mockctl](08-deploy-mockctl.md)
