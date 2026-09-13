"""Persisted sequential progress."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from labctl.paths import progress_path


@dataclass
class Progress:
    completed: list[str] = field(default_factory=list)
    scores: dict[str, dict[str, int]] = field(default_factory=dict)
    current: str = ""
    mode: str = "training"
    extra: dict[str, Any] = field(default_factory=dict)

    def is_done(self, lab_id: str) -> bool:
        return lab_id in self.completed

    def mark(self, lab_id: str, score: int, max_score: int) -> None:
        if lab_id not in self.completed:
            self.completed.append(lab_id)
        self.scores[lab_id] = {"score": score, "max": max_score}
        self.current = lab_id
        self.extra["updated"] = datetime.now(timezone.utc).isoformat()


def load() -> Progress:
    path = progress_path()
    if not path.is_file():
        return Progress()
    raw = json.loads(path.read_text(encoding="utf-8"))
    return Progress(
        completed=list(raw.get("completed") or []),
        scores=dict(raw.get("scores") or {}),
        current=str(raw.get("current") or ""),
        mode=str(raw.get("mode") or "training"),
        extra={k: v for k, v in raw.items() if k not in {"completed", "scores", "current", "mode"}},
    )


def save(progress: Progress) -> Path:
    path = progress_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "completed": progress.completed,
        "scores": progress.scores,
        "current": progress.current,
        "mode": progress.mode,
        **progress.extra,
    }
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    return path
