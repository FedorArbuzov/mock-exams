#!/usr/bin/env python3
"""Generate mkdocs-awesome-pages .pages files for each course directory."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COURSES = ROOT / "courses"

PATH_FILES = [
    "devops-path.md",
    "postgresql-path.md",
    "javascript-path.md",
    "golang-path.md",
]


def course_title(readme: Path, fallback: str) -> str:
    if readme.is_file():
        first = readme.read_text(encoding="utf-8").splitlines()[:1]
        if first and first[0].startswith("# "):
            return first[0][2:].strip()
    return fallback.replace("-", " ").title()


def write_course_pages(course_dir: Path) -> None:
    title = course_title(course_dir / "README.md", course_dir.name)
    content = f"title: {title}\nnav:\n  - README.md\n  - ...\n"
    (course_dir / ".pages").write_text(content, encoding="utf-8")


def write_root_pages() -> None:
    lines = [
        "nav:",
        "  - README.md",
    ]
    for path_file in PATH_FILES:
        lines.append(f"  - {path_file}")
    lines.append("  - ...")
    (COURSES / ".pages").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    write_root_pages()
    for entry in sorted(COURSES.iterdir()):
        if not entry.is_dir():
            continue
        if entry.name.startswith("."):
            continue
        write_course_pages(entry)
    print(f"Generated .pages for {len(list(COURSES.glob('*/.pages')))} course directories")


if __name__ == "__main__":
    main()
