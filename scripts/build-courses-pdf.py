#!/usr/bin/env python3
"""
Собирает все уроки из courses/ в один PDF.

Рекомендуемый способ — venv + requirements (без Pandoc):

  python -m venv .venv-pdf
  .venv-pdf\\Scripts\\activate          # Windows
  # source .venv-pdf/bin/activate      # Linux/macOS
  pip install -r scripts/requirements-pdf.txt
  playwright install chromium
  python scripts/build-courses-pdf.py

Или одной командой (Windows):  scripts\\setup-pdf-env.ps1

Запуск:
  python scripts/build-courses-pdf.py --group kubernetes
  python scripts/build-courses-pdf.py --course kuber-basic
  .\\scripts\\build-courses-pdf-groups.ps1          # все области
  python scripts/build-courses-pdf.py --list-groups
"""

from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

# PDF по областям: python scripts/build-courses-pdf.py --group <name>
COURSE_GROUPS: dict[str, tuple[str, ...]] = {
    "kubernetes": (
        "kuber-basic",
        "kuber-intermediate",
        "kuber-advanced",
        "gitops-basic",
        "gitops-intermediate",
        "mock-ckad",
        "mock-cka",
    ),
    "linux": (
        "linux-basic",
        "linux-intermediate",
        "linux-advanced",
        "linux-shell",
        "linux-security",
    ),
    "aws": (
        "aws-basic",
        "aws-terraform",
        "aws-intermediate",
        "aws-advanced",
        "finops",
    ),
    "gitlab": (
        "gitlab-basic",
        "gitlab-intermediate",
        "gitlab-advanced",
    ),
    "postgresql": (
        "postgresql-basic",
        "postgresql-intermediate",
        "postgresql-advanced",
        "postgresql-performance",
        "postgresql-developer",
        "postgresql-ops",
        "postgresql-security",
    ),
    "kafka": (
        "kafka-basic",
        "kafka-intermediate",
        "kafka-advanced",
    ),
    "redis": (
        "redis-basic",
        "redis-intermediate",
        "redis-advanced",
    ),
    "observability": (
        "observability-basic",
        "observability-intermediate",
        "observability-advanced",
        "opensearch-basic",
        "opensearch-intermediate",
    ),
    "messaging": (
        "rabbitmq-basic",
        "rabbitmq-intermediate",
        "messaging-deep",
    ),
    "platform": (
        "containers-basic",
        "nginx-basic",
        "nginx-intermediate",
        "secrets-basic",
        "secrets-advanced",
        "fastapi",
        "python-async",
        "python-testing",
        "django",
        "python-celery",
        "sqlalchemy-deep",
        "python-aws",
        "api-design",
        "python-algorithms",
        "python-deep-dive",
    ),
    "javascript": (
        "javascript-basic",
        "typescript-basic",
        "nodejs-basic",
        "react-basic",
        "react-intermediate",
        "nextjs-basic",
    ),
    "golang": (
        "go-basic",
        "go-intermediate",
    ),
    "theory": (
        "sre",
        "devops-culture",
        "appsec-fundamentals",
        "networking-deep",
        "bare-metal",
        "messaging-deep",
        "api-design",
        "microservices-patterns",
        "behavioral-interviews",
        "ood-python",
    ),
}

GROUP_TITLES: dict[str, str] = {
    "kubernetes": "Mock Exams — Kubernetes & GitOps",
    "linux": "Mock Exams — Linux",
    "aws": "Mock Exams — AWS & FinOps",
    "gitlab": "Mock Exams — GitLab CI/CD",
    "postgresql": "Mock Exams — PostgreSQL",
    "kafka": "Mock Exams — Apache Kafka",
    "redis": "Mock Exams — Redis",
    "observability": "Mock Exams — Observability & OpenSearch",
    "messaging": "Mock Exams — Messaging",
    "platform": "Mock Exams — Containers, Nginx, Secrets, API, Algorithms",
    "javascript": "Mock Exams — JavaScript & TypeScript",
    "golang": "Mock Exams — Go (Golang)",
    "theory": "Mock Exams — SRE, Culture, AppSec, Messaging, API, Microservices, Behavioral",
}


def discover_course_dirs(course_root: Path) -> tuple[str, ...]:
    return tuple(
        sorted(
            p.name
            for p in course_root.iterdir()
            if p.is_dir() and (p / "README.md").is_file()
        )
    )

HTML_PAGE_BREAK = '\n\n<div class="page-break"></div>\n\n'
PANDOC_PAGE_BREAK = "\n\n\\newpage\n\n"

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8"/>
  <title>{title}</title>
  <style>
    @page {{ size: A4; margin: 18mm 16mm; }}
    body {{
      font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.45;
      color: #1a1a1a;
      max-width: 100%;
    }}
    h1 {{ font-size: 22pt; margin-top: 1.2em; page-break-after: avoid; }}
    h2 {{ font-size: 16pt; margin-top: 1em; page-break-after: avoid; }}
    h3 {{ font-size: 13pt; page-break-after: avoid; }}
    h4, h5, h6 {{ page-break-after: avoid; }}
    pre, blockquote, table {{ page-break-inside: avoid; }}
    code {{
      font-family: Consolas, "DejaVu Sans Mono", monospace;
      font-size: 0.9em;
      background: #f4f4f5;
      padding: 0.1em 0.35em;
      border-radius: 3px;
    }}
    pre {{
      background: #f4f4f5;
      padding: 0.75em 1em;
      border-radius: 6px;
      overflow-x: auto;
      line-height: 1.35;
    }}
    pre code {{ background: none; padding: 0; }}
    table {{ border-collapse: collapse; width: 100%; margin: 1em 0; }}
    th, td {{ border: 1px solid #ccc; padding: 0.4em 0.6em; text-align: left; }}
    th {{ background: #eee; }}
    a {{ color: #0b57d0; }}
    hr {{ border: none; border-top: 1px solid #ddd; margin: 1.5em 0; }}
    .page-break {{ page-break-before: always; }}
    #toc {{
      background: #f8f9fa;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      padding: 1em 1.25em;
      margin-bottom: 2em;
    }}
    #toc > ul {{ margin: 0.5em 0 0; padding-left: 1.25em; }}
    #toc-title {{ font-size: 14pt; font-weight: 600; margin: 0; }}
    .doc-title {{
      font-size: 26pt;
      margin: 0 0 0.25em;
      border-bottom: 2px solid #333;
      padding-bottom: 0.3em;
    }}
  </style>
</head>
<body>
  <h1 class="doc-title">{title}</h1>
  <nav id="toc">
    <p id="toc-title">Содержание</p>
    {toc}
  </nav>
  <main>
    {body}
  </main>
</body>
</html>
"""


def natural_sort_key(path: Path) -> list:
    parts = re.split(r"(\d+)", path.name)
    return [int(p) if p.isdigit() else p.lower() for p in parts]


def collect_markdown(
    course_root: Path,
    *,
    courses: list[str] | None = None,
    include_index: bool = False,
) -> list[Path]:
    files: list[Path] = []

    root_readme = course_root / "README.md"
    if include_index and root_readme.is_file():
        files.append(root_readme)

    if courses is None:
        course_names = list(discover_course_dirs(course_root))
    else:
        course_names = courses

    for name in course_names:
        course_dir = course_root / name
        if not course_dir.is_dir():
            print(f"warning: пропуск — нет папки {course_dir}", file=sys.stderr)
            continue
        files.extend(_collect_in_dir(course_dir))

    return files


def _collect_in_dir(directory: Path) -> list[Path]:
    result: list[Path] = []

    readme = directory / "README.md"
    if readme.is_file():
        result.append(readme)

    for md in sorted(directory.glob("*.md"), key=natural_sort_key):
        if md.name != "README.md":
            result.append(md)

    for subdir in sorted(
        (p for p in directory.iterdir() if p.is_dir()),
        key=natural_sort_key,
    ):
        if subdir.name in {"node_modules", ".git", "dist", "build", ".next"}:
            continue
        result.extend(_collect_in_dir(subdir))

    return result


def merge_markdown(paths: list[Path], dest: Path, *, backend: str) -> None:
    page_break = HTML_PAGE_BREAK if backend == "playwright" else PANDOC_PAGE_BREAK
    chunks: list[str] = []
    for i, path in enumerate(paths):
        text = path.read_text(encoding="utf-8").strip()
        if i > 0:
            rel = path.as_posix()
            chunks.append(f"\n\n---\n\n<!-- {rel} -->\n\n")
            chunks.append(page_break)
        chunks.append(text)
        chunks.append("\n")
    dest.write_text("".join(chunks), encoding="utf-8")


def markdown_to_html(markdown_text: str) -> tuple[str, str]:
    try:
        import markdown
    except ImportError as exc:
        print(
            "Ошибка: не установлен пакет markdown.\n"
            "  pip install -r scripts/requirements-pdf.txt",
            file=sys.stderr,
        )
        raise SystemExit(1) from exc

    md = markdown.Markdown(
        extensions=[
            "extra",
            "toc",
            "codehilite",
            "tables",
            "fenced_code",
            "sane_lists",
        ],
        extension_configs={
            "toc": {"permalink": False, "toc_depth": 2},
            "codehilite": {"css_class": "highlight", "guess_lang": True},
        },
    )
    body = md.convert(markdown_text)
    toc = getattr(md, "toc", "") or "<p><em>Оглавление пусто</em></p>"
    return body, toc


def run_playwright(html: str, output_pdf: Path) -> None:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError as exc:
        print(
            "Ошибка: не установлен playwright.\n"
            "  pip install -r scripts/requirements-pdf.txt\n"
            "  playwright install chromium",
            file=sys.stderr,
        )
        raise SystemExit(1) from exc

    output_pdf.parent.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.set_content(html, wait_until="load")
        page.pdf(
            path=str(output_pdf),
            format="A4",
            margin={"top": "18mm", "bottom": "18mm", "left": "16mm", "right": "16mm"},
            print_background=True,
        )
        browser.close()


def build_html(merged_md: Path, title: str) -> str:
    text = merged_md.read_text(encoding="utf-8")
    body, toc = markdown_to_html(text)
    return HTML_TEMPLATE.format(title=title, toc=toc, body=body)


def run_pandoc(
    merged_md: Path,
    output_pdf: Path,
    pdf_engine: str,
    title: str,
) -> None:
    pandoc = shutil.which("pandoc")
    if not pandoc:
        print(
            "Ошибка: pandoc не найден в PATH.\n"
            "Используйте backend playwright (по умолчанию) или установите Pandoc.",
            file=sys.stderr,
        )
        sys.exit(1)

    if pdf_engine == "wkhtmltopdf" and not shutil.which("wkhtmltopdf"):
        print(
            "Ошибка: wkhtmltopdf не найден.\n"
            "Установите wkhtmltopdf или укажите --pdf-engine xelatex.",
            file=sys.stderr,
        )
        sys.exit(1)

    output_pdf.parent.mkdir(parents=True, exist_ok=True)

    cmd = [
        pandoc,
        str(merged_md),
        "-o",
        str(output_pdf),
        "--from=markdown",
        "--toc",
        "--toc-depth=2",
        "--number-sections",
        f"--pdf-engine={pdf_engine}",
        "-V",
        f"title={title}",
        "-V",
        "lang=ru",
        "--highlight-style=tango",
    ]

    if pdf_engine == "xelatex":
        cmd.extend(["-V", "mainfont=DejaVu Sans", "-V", "monofont=DejaVu Sans Mono"])
    elif pdf_engine == "wkhtmltopdf":
        cmd.extend(
            [
                "-V",
                "margin-top=20mm",
                "-V",
                "margin-bottom=20mm",
                "-V",
                "margin-left=18mm",
                "-V",
                "margin-right=18mm",
            ]
        )

    print("Запуск:", " ".join(cmd))
    subprocess.run(cmd, check=True)


def list_groups() -> None:
    print("Группы (--group):")
    for name, members in COURSE_GROUPS.items():
        print(f"  {name:16}  {len(members)} курсов  ->  dist/{name}.pdf")
        for m in members:
            print(f"      - {m}")


def main() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    default_courses = repo_root / "courses"
    all_courses = discover_course_dirs(default_courses)

    parser = argparse.ArgumentParser(description="Собрать courses/*.md в один PDF")
    parser.add_argument("--courses-dir", type=Path, default=default_courses)
    parser.add_argument(
        "--output",
        type=Path,
        help="Путь к PDF (по умолчанию: dist/<group>.pdf или dist/courses.pdf)",
    )
    target = parser.add_mutually_exclusive_group()
    target.add_argument("--course", choices=all_courses, metavar="COURSE")
    target.add_argument(
        "--group",
        choices=sorted(COURSE_GROUPS),
        metavar="GROUP",
        help="Несколько курсов одной областью в один PDF",
    )
    parser.add_argument(
        "--include-index",
        action="store_true",
        help="Добавить courses/README.md в начало",
    )
    parser.add_argument(
        "--list-groups",
        action="store_true",
        help="Показать группы и выйти",
    )
    parser.add_argument(
        "--backend",
        choices=("playwright", "pandoc"),
        default="playwright",
        help="playwright — через venv (по умолчанию); pandoc — внешняя утилита",
    )
    parser.add_argument(
        "--pdf-engine",
        default="wkhtmltopdf",
        choices=("wkhtmltopdf", "xelatex", "pdflatex"),
        help="Только для --backend pandoc",
    )
    parser.add_argument("--title", help="Заголовок PDF (для --group подставляется сам)")
    parser.add_argument("--list-only", action="store_true")
    parser.add_argument(
        "--keep-merged",
        action="store_true",
        help="Сохранить объединённый .md рядом с PDF",
    )
    parser.add_argument(
        "--keep-html",
        action="store_true",
        help="Сохранить .html рядом с PDF (только playwright)",
    )
    args = parser.parse_args()

    if args.list_groups:
        list_groups()
        return

    courses_dir = args.courses_dir.resolve()
    if not courses_dir.is_dir():
        print(f"Ошибка: нет папки {courses_dir}", file=sys.stderr)
        sys.exit(1)

    if args.group:
        course_list = list(COURSE_GROUPS[args.group])
        title = args.title or GROUP_TITLES[args.group]
        output = args.output or (repo_root / "dist" / f"{args.group}.pdf")
        include_index = args.include_index
    elif args.course:
        course_list = [args.course]
        title = args.title or f"Mock Exams — {args.course}"
        output = args.output or (repo_root / "dist" / f"{args.course}.pdf")
        include_index = False
    else:
        course_list = None
        title = args.title or "Mock Exams — All Courses"
        output = args.output or (repo_root / "dist" / "courses-all.pdf")
        include_index = True

    paths = collect_markdown(
        courses_dir,
        courses=course_list,
        include_index=include_index,
    )
    if not paths:
        print("Ошибка: не найдено ни одного .md файла", file=sys.stderr)
        sys.exit(1)

    print(f"Найдено файлов: {len(paths)}")
    for p in paths:
        print(f"  {p.relative_to(courses_dir)}")

    if args.list_only:
        return

    output_pdf = output.resolve()

    with tempfile.TemporaryDirectory(prefix="courses-pdf-") as tmp:
        tmp_dir = Path(tmp)
        merged = tmp_dir / "merged.md"
        merge_markdown(paths, merged, backend=args.backend)

        if args.keep_merged:
            kept_md = output_pdf.with_suffix(".md")
            kept_md.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy(merged, kept_md)
            print(f"Объединённый markdown: {kept_md}")

        if args.backend == "playwright":
            html = build_html(merged, title)
            if args.keep_html:
                kept_html = output_pdf.with_suffix(".html")
                kept_html.parent.mkdir(parents=True, exist_ok=True)
                kept_html.write_text(html, encoding="utf-8")
                print(f"HTML: {kept_html}")
            run_playwright(html, output_pdf)
        else:
            run_pandoc(merged, output_pdf, args.pdf_engine, title)

    print(f"Готово: {output_pdf}")


if __name__ == "__main__":
    main()
