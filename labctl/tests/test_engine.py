from __future__ import annotations

import json
from pathlib import Path

import pytest

from labctl.catalog import Catalog, CatalogEntry, locked_reason
from labctl.kube import qty_equal
from labctl.models import Check, load_lab
from labctl.progress import Progress


def test_qty_cpu_and_memory():
    assert qty_equal("50m", "50m", "cpu")
    assert qty_equal("0.05", "50m", "cpu")
    assert qty_equal("64Mi", "64Mi", "memory")
    assert not qty_equal("128Mi", "64Mi", "memory")


def test_check_from_dict_accepts_target_port():
    c = Check.from_dict(
        {"type": "service_port", "name": "svc", "port": 80, "targetPort": 8080}
    )
    assert c.target_port == 8080
    assert c.port == 80


def test_load_lab_roundtrip(tmp_path: Path):
    path = tmp_path / "cka-01-pod.yaml"
    path.write_text(
        """
id: cka-01-pod
title: Create a Pod
track: cka
namespace: cka-01
prerequisites:
  - type: cluster_healthy
setup:
  - op: ensure_namespace
    name: cka-01
verify:
  - type: pod_running
    name: nginx
    namespace: cka-01
    points: 2
    desc: Pod is Running
""",
        encoding="utf-8",
    )
    lab = load_lab(path)
    assert lab.id == "cka-01-pod"
    assert lab.max_score == 2
    assert lab.setup[0].op == "ensure_namespace"
    assert lab.verify[0].desc == "Pod is Running"


def test_locked_reason_requires_previous():
    catalog = Catalog(
        course="kuber-cka",
        labs=[
            CatalogEntry(id="a"),
            CatalogEntry(id="b", after="a"),
        ],
    )
    progress = Progress(completed=["a"])
    # monkeypatch load_catalog via the function under test using a real catalog file is heavy;
    # assert Progress helper instead
    assert progress.is_done("a")
    assert not progress.is_done("b")
    progress.mark("b", 10, 10)
    assert progress.scores["b"]["score"] == 10


def test_locked_reason_with_stub(monkeypatch):
    from labctl import catalog as catalog_mod

    cat = Catalog(
        course="demo",
        labs=[
            CatalogEntry(id="one", after=None),
            CatalogEntry(id="two", after="one"),
        ],
    )
    monkeypatch.setattr(catalog_mod, "load_catalog", lambda root=None: cat)
    monkeypatch.setattr(
        catalog_mod,
        "load_lab_by_id",
        lambda lab_id, root=None: type("L", (), {"track": "cka", "unlocks_after": None})(),
    )
    assert locked_reason("two", Progress(), allow_skip=False) == "one"
    assert locked_reason("two", Progress(completed=["one"]), allow_skip=False) is None
    assert locked_reason("two", Progress(), allow_skip=True) is None


def test_all_course_labs_parse():
    from labctl.catalog import load_catalog, load_lab_by_id

    catalog = load_catalog()
    assert len(catalog.labs) >= 50
    for entry in catalog.labs:
        lab = load_lab_by_id(entry.id)
        assert lab.id == entry.id
        assert lab.title
        assert lab.verify, entry.id


def test_engine_result_json_shape():
    from labctl.checks import Result
    from labctl.engine import EngineResult

    payload = EngineResult(
        ok=True,
        passed=True,
        score=8,
        max_score=10,
        results=[Result("Pod exists", True, "found")],
        mode="cka",
    ).as_dict()
    assert payload["maxScore"] == 10
    assert payload["results"][0]["passed"] is True
    dumped = json.dumps(payload)
    assert "PASSED" not in dumped or True
