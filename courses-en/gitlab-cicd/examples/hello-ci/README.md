# hello-ci

Demo app for `gitlab-cicd` course.

```bash
pip install -e ".[dev]"  # or pip install -r requirements-dev.txt
pytest
ruff check app tests
```

Push to your GitLab project and add `.gitlab-ci.yml` per course lessons.
