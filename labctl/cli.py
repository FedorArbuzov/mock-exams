"""CLI: python -m labctl <start|check|cleanup|hint|status|task> --lab <id>."""

from __future__ import annotations

import argparse
import json
import sys

from labctl import __version__
from labctl.catalog import load_catalog, load_lab_by_id
from labctl.engine import EngineResult, check, cleanup, hint, start
from labctl.paths import allow_skip, mode
from labctl.progress import load as load_progress


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="labctl",
        description="Prepare, verify, and score Kubernetes administrator labs.",
    )
    parser.add_argument("--version", action="version", version=f"labctl {__version__}")
    sub = parser.add_subparsers(dest="cmd", required=True)

    for name, help_text in (
        ("start", "Prepare the cluster and validate the initial lab state"),
        ("check", "Grade the current cluster state"),
        ("cleanup", "Restore / remove this lab's resources"),
        ("hint", "Show the next training-mode hint"),
        ("task", "Print the task or ON-CALL ticket"),
    ):
        p = sub.add_parser(name, help=help_text)
        p.add_argument("--lab", required=True, help="Lab id, e.g. cka-01-pod")
        p.add_argument("--json", action="store_true", help="Machine-readable output")

    st = sub.add_parser("status", help="Show sequential course progress")
    st.add_argument("--json", action="store_true")

    md = sub.add_parser("mode", help="Show or persist the current mode")
    md.add_argument("value", nargs="?", choices=["training", "cka", "oncall", "exam"])
    md.add_argument("--json", action="store_true")

    args = parser.parse_args(argv)

    if args.cmd == "status":
        return _status(bool(getattr(args, "json", False)))
    if args.cmd == "mode":
        return _mode_cmd(getattr(args, "value", None), bool(getattr(args, "json", False)))

    try:
        lab = load_lab_by_id(args.lab)
    except FileNotFoundError as exc:
        return _emit(EngineResult(ok=False, error=str(exc)), args.json, err=True)

    if args.cmd == "start":
        result = start(lab)
    elif args.cmd == "check":
        result = check(lab)
    elif args.cmd == "cleanup":
        result = cleanup(lab)
    elif args.cmd == "hint":
        result = hint(lab)
    elif args.cmd == "task":
        result = _task(lab)
    else:
        return 2

    return _emit(result, args.json, err=not result.ok)


def _task(lab) -> EngineResult:
    from labctl.engine import EngineResult

    if lab.ticket and mode() in {"oncall", "training"}:
        t = lab.ticket
        text = f"{t.id}  {t.priority}\n\n{t.title}\n\n{t.body}".strip()
        return EngineResult(ok=True, note=text, mode=mode())
    return EngineResult(ok=True, note=lab.task.strip() or lab.title, mode=mode())


def _status(as_json: bool) -> int:
    catalog = load_catalog()
    progress = load_progress()
    rows = []
    locked = False
    for entry in catalog.labs:
        if progress.is_done(entry.id):
            mark = "done"
            icon = "[x]"
        elif locked:
            mark = "locked"
            icon = "[ ]"
        else:
            mark = "current"
            icon = "[>]"
            locked = not allow_skip()
        rows.append({"id": entry.id, "title": entry.title or entry.id, "status": mark})
        if as_json:
            continue
        title = entry.title or entry.id
        print(f"{entry.id:<28} {icon}  {title}")
    if as_json:
        print(json.dumps({"mode": mode(), "labs": rows}, indent=2))
    else:
        print()
        print(f"Mode: {mode()}")
        print(f"Completed: {len(progress.completed)}/{len(catalog.labs)}")
    return 0


def _mode_cmd(value: str | None, as_json: bool) -> int:
    from labctl.progress import save

    progress = load_progress()
    if value:
        progress.mode = value
        save(progress)
        print(
            f"Saved preferred mode {value!r} in progress file. "
            f"Override any time with LABCTL_MODE={value}",
            file=sys.stderr,
        )
    current = mode()
    if as_json:
        print(json.dumps({"mode": current, "stored": progress.mode}))
    else:
        print(current)
    return 0


def _emit(result: EngineResult, as_json: bool, err: bool = False) -> int:
    if as_json:
        print(json.dumps(result.as_dict(), ensure_ascii=False))
        return 0 if result.ok else 1
    if result.error:
        print(result.error, file=sys.stderr)
    if result.results:
        print()
        for item in result.results:
            mark = "OK" if item.passed else "FAIL"
            extra = f" — {item.message}" if item.message else ""
            print(f"{mark} {item.name}{extra}")
    if result.score is not None and result.max_score is not None:
        print()
        print(f"Score: {result.score}/{result.max_score}")
    if result.note:
        print()
        print(result.note)
    if result.passed and not result.note:
        print()
        print("PASSED")
    return 1 if err else (0 if result.ok else 1)


if __name__ == "__main__":
    raise SystemExit(main())
