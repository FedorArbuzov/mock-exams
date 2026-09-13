"""Resolve course tree, kubeconfig, and student workdir."""

from __future__ import annotations

import os
from pathlib import Path

COURSE_ID = "kuber-cka"
DEFAULT_WORKDIR_NAME = "kuber-cka"
KUBECONFIG_NAME = "kuber-cka.conf"


def repo_root(start: Path | None = None) -> Path:
    cur = (start or Path.cwd()).resolve()
    for candidate in [cur, *cur.parents]:
        if (candidate / "labctl" / "__init__.py").is_file() and (
            candidate / "courses-en" / COURSE_ID
        ).is_dir():
            return candidate
        if (candidate / "labctl" / "__init__.py").is_file() and (
            candidate / "courses" / COURSE_ID
        ).is_dir():
            return candidate
    env = os.environ.get("LABCTL_ROOT")
    if env:
        return Path(env).expanduser().resolve()
    raise FileNotFoundError(
        "Cannot find repository root (looked for labctl/ and courses-en/kuber-cka). "
        "Run from the mock-exams repo or set LABCTL_ROOT."
    )


def courses_dir(root: Path | None = None) -> Path:
    env = os.environ.get("LABCTL_COURSES_DIR")
    if env:
        return Path(env).expanduser().resolve()
    root = root or repo_root()
    en = root / "courses-en" / COURSE_ID
    if en.is_dir():
        return en
    ru = root / "courses" / COURSE_ID
    if ru.is_dir():
        return ru
    raise FileNotFoundError(f"Course directory {COURSE_ID} not found under {root}")


def labs_dir(root: Path | None = None) -> Path:
    return courses_dir(root) / "labs"


def workdir() -> Path:
    env = os.environ.get("KUBER_CKA_DIR")
    if env:
        return Path(env).expanduser().resolve()
    return (Path.home() / DEFAULT_WORKDIR_NAME).resolve()


def progress_path() -> Path:
    env = os.environ.get("LABCTL_PROGRESS")
    if env:
        return Path(env).expanduser().resolve()
    return Path.home() / ".labctl" / "progress.json"


def kubeconfig_path() -> str | None:
    env = os.environ.get("KUBECONFIG")
    if env:
        return env
    preferred = Path.home() / ".kube" / KUBECONFIG_NAME
    if preferred.is_file():
        return str(preferred)
    return None


def mode() -> str:
    value = (os.environ.get("LABCTL_MODE") or "training").strip().lower()
    if value in {"training", "cka", "oncall", "exam"}:
        return value
    return "training"


def allow_skip() -> bool:
    return os.environ.get("LABCTL_ALLOW_SKIP", "").strip() in {"1", "true", "yes"}
