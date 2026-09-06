#!/usr/bin/env python3
"""Generate mkdocs-awesome-pages .pages files when a course directory has none."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

PATH_FILES = [
    "devops-path.md",
    "postgresql-path.md",
    "javascript-path.md",
    "golang-path.md",
]

TREES = (ROOT / "courses", ROOT / "courses-en")


def course_title(readme: Path, fallback: str) -> str:
    if readme.is_file():
        first = readme.read_text(encoding="utf-8").splitlines()[:1]
        if first and first[0].startswith("# "):
            return first[0][2:].strip()
    return fallback.replace("-", " ").title()


def write_course_pages(course_dir: Path) -> None:
    pages = course_dir / ".pages"
    if pages.exists():
        return
    title = course_title(course_dir / "README.md", course_dir.name)
    pages.write_text(f"title: {title}\nnav:\n  - README.md\n  - ...\n", encoding="utf-8")


def write_root_pages(courses: Path) -> None:
    pages = courses / ".pages"
    if pages.exists():
        return
    lines = ["nav:", "  - README.md"]
    for path_file in PATH_FILES:
        if (courses / path_file).is_file():
            lines.append(f"  - {path_file}")
    lines.append("  - ...")
    pages.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    generated = 0
    for courses in TREES:
        if not courses.is_dir():
            continue
        write_root_pages(courses)
        for entry in sorted(courses.iterdir()):
            if not entry.is_dir() or entry.name.startswith("."):
                continue
            before = (entry / ".pages").exists()
            write_course_pages(entry)
            if not before and (entry / ".pages").exists():
                generated += 1
    print(f"Generated {generated} missing course .pages files")


if __name__ == "__main__":
    main()
