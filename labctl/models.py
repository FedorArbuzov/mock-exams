"""Declarative lab definition loaded from YAML."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


def _require_yaml():
    try:
        import yaml
    except ImportError as exc:
        raise SystemExit(
            "PyYAML is required: pip install -r labctl/requirements.txt"
        ) from exc
    return yaml


@dataclass
class Check:
    type: str
    desc: str = ""
    kind: str = ""
    name: str = ""
    namespace: str = ""
    key: str = ""
    value: str = ""
    points: int = 1
    min: int | None = None
    max: int | None = None
    node: str = ""
    url: str = ""
    host: str = ""
    port: int | None = None
    target_port: int | None = None
    protocol: str = ""
    request_cpu: str = ""
    request_memory: str = ""
    limit_cpu: str = ""
    limit_memory: str = ""
    image: str = ""
    path: str = ""
    nodes: list[str] = field(default_factory=list)
    labels: dict[str, str] = field(default_factory=dict)
    extra: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_dict(cls, raw: dict[str, Any]) -> "Check":
        known = {
            "type",
            "desc",
            "kind",
            "name",
            "namespace",
            "key",
            "value",
            "points",
            "min",
            "max",
            "node",
            "url",
            "host",
            "port",
            "target_port",
            "targetPort",
            "protocol",
            "request_cpu",
            "request_memory",
            "limit_cpu",
            "limit_memory",
            "image",
            "path",
            "nodes",
            "labels",
        }
        data = dict(raw)
        if "targetPort" in data and "target_port" not in data:
            data["target_port"] = data["targetPort"]
        extra = {k: v for k, v in data.items() if k not in known}
        return cls(
            type=str(data.get("type") or ""),
            desc=str(data.get("desc") or ""),
            kind=str(data.get("kind") or ""),
            name=str(data.get("name") or ""),
            namespace=str(data.get("namespace") or ""),
            key=str(data.get("key") or ""),
            value="" if data.get("value") is None else str(data.get("value")),
            points=int(data.get("points") or 1),
            min=data.get("min"),
            max=data.get("max"),
            node=str(data.get("node") or ""),
            url=str(data.get("url") or ""),
            host=str(data.get("host") or ""),
            port=data.get("port"),
            target_port=data.get("target_port"),
            protocol=str(data.get("protocol") or ""),
            request_cpu=str(data.get("request_cpu") or ""),
            request_memory=str(data.get("request_memory") or ""),
            limit_cpu=str(data.get("limit_cpu") or ""),
            limit_memory=str(data.get("limit_memory") or ""),
            image=str(data.get("image") or data.get("value") or ""),
            path=str(data.get("path") or ""),
            nodes=list(data.get("nodes") or []),
            labels=dict(data.get("labels") or {}),
            extra=extra,
        )


@dataclass
class Action:
    op: str
    name: str = ""
    namespace: str = ""
    kind: str = ""
    file: str = ""
    node: str = ""
    command: str = ""
    service: str = ""
    key: str = ""
    value: str = ""
    effect: str = ""
    args: list[str] = field(default_factory=list)
    extra: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_dict(cls, raw: dict[str, Any]) -> "Action":
        known = {
            "op",
            "name",
            "namespace",
            "kind",
            "file",
            "manifest",
            "node",
            "command",
            "service",
            "key",
            "value",
            "effect",
            "args",
        }
        data = dict(raw)
        extra = {k: v for k, v in data.items() if k not in known}
        return cls(
            op=str(data.get("op") or ""),
            name=str(data.get("name") or ""),
            namespace=str(data.get("namespace") or ""),
            kind=str(data.get("kind") or ""),
            file=str(data.get("file") or data.get("manifest") or ""),
            node=str(data.get("node") or ""),
            command=str(data.get("command") or ""),
            service=str(data.get("service") or ""),
            key=str(data.get("key") or ""),
            value=str(data.get("value") or ""),
            effect=str(data.get("effect") or ""),
            args=[str(x) for x in (data.get("args") or [])],
            extra=extra,
        )


@dataclass
class Ticket:
    id: str = ""
    priority: str = ""
    title: str = ""
    body: str = ""


@dataclass
class Lab:
    id: str
    title: str
    track: str = "cka"
    namespace: str = ""
    pass_score: int | None = None
    unlocks_after: str | None = None
    task: str = ""
    explanation: str = ""
    root_cause: str = ""
    hints: list[str] = field(default_factory=list)
    prerequisites: list[Check] = field(default_factory=list)
    setup: list[Action] = field(default_factory=list)
    initial_state: list[Check] = field(default_factory=list)
    verify: list[Check] = field(default_factory=list)
    cleanup: list[Action] = field(default_factory=list)
    ticket: Ticket | None = None
    hide_hints: bool = False
    hide_root_cause: bool = False
    source: Path | None = None

    @property
    def max_score(self) -> int:
        if not self.verify:
            return 0
        return sum(max(1, c.points) for c in self.verify)


def load_lab(path: Path) -> Lab:
    yaml = _require_yaml()
    raw = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    if not raw.get("id") or not raw.get("title"):
        raise ValueError(f"{path}: id and title are required")
    ticket = None
    if raw.get("ticket"):
        t = raw["ticket"]
        ticket = Ticket(
            id=str(t.get("id") or ""),
            priority=str(t.get("priority") or ""),
            title=str(t.get("title") or ""),
            body=str(t.get("body") or ""),
        )
    return Lab(
        id=str(raw["id"]),
        title=str(raw["title"]),
        track=str(raw.get("track") or "cka"),
        namespace=str(raw.get("namespace") or ""),
        pass_score=raw.get("pass_score"),
        unlocks_after=raw.get("unlocks_after"),
        task=str(raw.get("task") or ""),
        explanation=str(raw.get("explanation") or ""),
        root_cause=str(raw.get("root_cause") or ""),
        hints=[str(h) for h in (raw.get("hints") or [])],
        prerequisites=[Check.from_dict(x) for x in (raw.get("prerequisites") or [])],
        setup=[Action.from_dict(x) for x in (raw.get("setup") or [])],
        initial_state=[Check.from_dict(x) for x in (raw.get("initial_state") or [])],
        verify=[Check.from_dict(x) for x in (raw.get("verify") or [])],
        cleanup=[Action.from_dict(x) for x in (raw.get("cleanup") or [])],
        ticket=ticket,
        hide_hints=bool(raw.get("hide_hints")),
        hide_root_cause=bool(raw.get("hide_root_cause")),
        source=path,
    )
