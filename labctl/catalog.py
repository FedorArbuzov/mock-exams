"""Ordered course catalog and unlock rules."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

from labctl.models import Lab, load_lab
from labctl.paths import labs_dir
from labctl.progress import Progress


def _require_yaml():
    try:
        import yaml
    except ImportError as exc:
        raise SystemExit(
            "PyYAML is required: pip install -r labctl/requirements.txt"
        ) from exc
    return yaml


@dataclass
class CatalogEntry:
    id: str
    title: str = ""
    track: str = ""
    after: str | None = None
    optional: bool = False
    file: str = ""


@dataclass
class Catalog:
    course: str
    labs: list[CatalogEntry] = field(default_factory=list)
    tracks: list[str] = field(default_factory=list)

    def entry(self, lab_id: str) -> CatalogEntry | None:
        for item in self.labs:
            if item.id == lab_id:
                return item
        return None

    def previous(self, lab_id: str) -> str | None:
        entry = self.entry(lab_id)
        if entry and entry.after:
            return entry.after
        for idx, item in enumerate(self.labs):
            if item.id == lab_id:
                if idx == 0:
                    return None
                prev = self.labs[idx - 1]
                if prev.optional:
                    return self.previous(prev.id)
                return prev.id
        return None


def load_catalog(root: Path | None = None) -> Catalog:
    yaml = _require_yaml()
    path = labs_dir(root) / "catalog.yaml"
    if not path.is_file():
        return Catalog(course="kuber-cka")
    raw = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    labs: list[CatalogEntry] = []
    prev_id: str | None = None
    for item in raw.get("labs") or []:
        if isinstance(item, str):
            after = prev_id
            labs.append(CatalogEntry(id=item, after=after, file=f"{item}.yaml"))
            prev_id = item
            continue
        lab_id = str(item.get("id") or "")
        after = item.get("after")
        if after is None and not item.get("first"):
            after = prev_id
        labs.append(
            CatalogEntry(
                id=lab_id,
                title=str(item.get("title") or ""),
                track=str(item.get("track") or ""),
                after=after,
                optional=bool(item.get("optional")),
                file=str(item.get("file") or f"{lab_id}.yaml"),
            )
        )
        if not item.get("optional"):
            prev_id = lab_id
    return Catalog(
        course=str(raw.get("course") or "kuber-cka"),
        labs=labs,
        tracks=[str(t) for t in (raw.get("tracks") or [])],
    )


def find_lab_file(lab_id: str, root: Path | None = None) -> Path:
    catalog = load_catalog(root)
    entry = catalog.entry(lab_id)
    base = labs_dir(root)
    if entry and entry.file:
        path = base / entry.file
        if path.is_file():
            return path
    direct = base / f"{lab_id}.yaml"
    if direct.is_file():
        return direct
    raise FileNotFoundError(f"No lab definition for {lab_id}")


def load_lab_by_id(lab_id: str, root: Path | None = None) -> Lab:
    lab = load_lab(find_lab_file(lab_id, root))
    entry = load_catalog(root).entry(lab_id)
    if entry and entry.after and not lab.unlocks_after:
        lab.unlocks_after = entry.after
    return lab


def locked_reason(lab_id: str, progress: Progress, allow_skip: bool) -> str | None:
    if allow_skip:
        return None
    catalog = load_catalog()
    entry = catalog.entry(lab_id)
    if entry and entry.optional:
        return None
    # mock exam is a separate track
    lab = None
    try:
        lab = load_lab_by_id(lab_id)
    except FileNotFoundError:
        pass
    if lab and lab.track == "mock":
        return None
    needed = catalog.previous(lab_id)
    if lab and lab.unlocks_after:
        needed = lab.unlocks_after
    if not needed:
        return None
    if progress.is_done(needed):
        return None
    return needed
