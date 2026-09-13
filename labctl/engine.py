"""Lab lifecycle: prepare → validate → task → verify → score → cleanup."""

from __future__ import annotations

from dataclasses import dataclass, field

from labctl.actions import ActionError, run_all
from labctl.catalog import locked_reason
from labctl.checks import Result, evaluate_all
from labctl.kube import KubeError, refuse_docker_desktop
from labctl.models import Lab
from labctl.paths import allow_skip, mode as current_mode
from labctl.progress import Progress, load as load_progress, save as save_progress


@dataclass
class EngineResult:
    ok: bool
    passed: bool = False
    error: str = ""
    note: str = ""
    score: int | None = None
    max_score: int | None = None
    results: list[Result] = field(default_factory=list)
    mode: str = "training"
    next_lab: str = ""

    def as_dict(self) -> dict:
        payload = {
            "ok": self.ok,
            "passed": self.passed,
            "error": self.error or None,
            "note": self.note or None,
            "score": self.score,
            "maxScore": self.max_score,
            "results": [r.as_dict() for r in self.results],
            "mode": self.mode,
            "nextLab": self.next_lab or None,
        }
        return {k: v for k, v in payload.items() if v is not None or k in {"ok", "passed", "results"}}


def _fail(message: str, results: list[Result] | None = None) -> EngineResult:
    return EngineResult(
        ok=False,
        error=message,
        results=results or [],
        mode=current_mode(),
    )


def _gate(lab: Lab) -> EngineResult | None:
    progress = load_progress()
    needed = locked_reason(lab.id, progress, allow_skip())
    if needed:
        return _fail(
            f"Cannot start lab.\n\nReason:\n{lab.id} is locked. Complete {needed} first."
        )
    return None


def start(lab: Lab) -> EngineResult:
    blocked = _gate(lab)
    if blocked:
        return blocked
    mode = current_mode()
    try:
        if lab.prerequisites:
            refuse_docker_desktop()
    except KubeError as exc:
        return _fail(f"Cannot start lab.\n\nReason:\n{exc}")

    if lab.prerequisites:
        pre = evaluate_all(lab.prerequisites)
        failed = [r for r in pre if not r.passed]
        if failed:
            reasons = "\n".join(f"{r.name}: {r.message}" for r in failed)
            return _fail(f"Cannot start lab.\n\nReason:\n{reasons}", pre)

    try:
        run_all(lab.setup)
    except (ActionError, KubeError) as exc:
        return _fail(f"Cannot start lab.\n\nReason:\nsetup failed: {exc}")

    initial = evaluate_all(lab.initial_state) if lab.initial_state else []
    bad = [r for r in initial if not r.passed]
    if bad:
        reasons = "\n".join(f"{r.name}: {r.message}" for r in bad)
        return _fail(
            f"Cannot start lab.\n\nReason:\ncluster did not reach the required initial state:\n{reasons}",
            initial,
        )

    note = "Lab ready."
    if mode == "training" and lab.initial_state:
        note = "Expected initial state holds. Lab ready."
    if mode == "oncall" and lab.ticket:
        note = f"Ticket {lab.ticket.id} ({lab.ticket.priority}). Investigate and restore service."
    return EngineResult(ok=True, note=note, results=initial, mode=mode)


def check(lab: Lab, persist: bool = True) -> EngineResult:
    mode = current_mode()
    results = evaluate_all(lab.verify)
    score = 0
    max_score = lab.max_score
    for res, spec in zip(results, lab.verify):
        if res.passed:
            score += max(1, spec.points)
    if lab.pass_score is not None:
        passed = score >= int(lab.pass_score)
    else:
        passed = all(r.passed for r in results) if results else False

    note = ""
    next_lab = ""
    if passed:
        if persist:
            progress = load_progress()
            progress.mark(lab.id, score, max_score)
            save_progress(progress)
            next_lab = _next_after(lab.id, progress)
        if mode == "cka":
            note = f"PASSED\nScore: {score}/{max_score}"
        elif mode == "oncall":
            note = f"Incident resolved.\n\nScore: {score}/{max_score}"
            if next_lab:
                note += f"\n\nMoving to {next_lab}..."
        else:
            parts = [f"Score: {score}/{max_score}"]
            if lab.explanation:
                parts.append(lab.explanation.strip())
            if lab.root_cause:
                parts.append("Root cause:\n" + lab.root_cause.strip())
            if next_lab:
                parts.append(f"Next: {next_lab}")
            note = "\n\n".join(parts)
    elif mode == "training" and lab.hints:
        note = "Not there yet. In training mode you may run: python -m labctl hint --lab " + lab.id

    return EngineResult(
        ok=True,
        passed=passed,
        note=note,
        score=score,
        max_score=max_score,
        results=results,
        mode=mode,
        next_lab=next_lab,
    )


def cleanup(lab: Lab) -> EngineResult:
    try:
        run_all(lab.cleanup)
    except (ActionError, KubeError) as exc:
        return _fail(f"Cleanup failed: {exc}")
    return EngineResult(ok=True, note="Cleaned up. The cluster is still running.", mode=current_mode())


def hint(lab: Lab) -> EngineResult:
    mode = current_mode()
    if mode != "training" or lab.hide_hints:
        return _fail("Hints are disabled in this mode.")
    if not lab.hints:
        return EngineResult(ok=True, note="No hints for this lab.", mode=mode)
    progress = load_progress()
    used = int((progress.extra.get("hints") or {}).get(lab.id) or 0)
    text = lab.hints[min(used, len(lab.hints) - 1)]
    hints = dict(progress.extra.get("hints") or {})
    hints[lab.id] = min(used + 1, len(lab.hints))
    progress.extra["hints"] = hints
    save_progress(progress)
    return EngineResult(ok=True, note=text, mode=mode)


def _next_after(lab_id: str, progress: Progress) -> str:
    from labctl.catalog import load_catalog

    catalog = load_catalog()
    found = False
    for entry in catalog.labs:
        if found and not progress.is_done(entry.id):
            return entry.id
        if entry.id == lab_id:
            found = True
    return ""
