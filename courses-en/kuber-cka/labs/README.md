# Lab definitions

Declarative labs for [`labctl`](../../../labctl/README.md). Order and unlocks: [`catalog.yaml`](catalog.yaml).

```yaml
id: cka-01-pod
title: Create a Pod
track: cka          # bootstrap | cka | troubleshooting | admin | oncall | mock
namespace: cka-01

prerequisites:      # must pass before setup
  - type: cluster_healthy

setup:              # mutate the real cluster
  - op: ensure_namespace
    name: cka-01

initial_state:      # student-safe; must hold after setup
  - type: namespace_exists
    name: cka-01
    desc: Namespace cka-01 exists

task: |
  ...

ticket:             # ON-CALL
  id: INC-01
  priority: P2
  title: ...
  body: ...

hints: []           # training mode only
explanation: ""     # after a pass in training
root_cause: ""      # after a pass in training

verify:             # result only — never command history
  - type: pod_running
    name: nginx
    namespace: cka-01
    points: 2
    desc: Pod is Running

cleanup:
  - op: delete_namespace
    name: cka-01
```

Regenerate YAML + lesson sidecars from [`scripts/write_labs.py`](../scripts/write_labs.py) if you change that script. Prefer editing a single `labs/<id>.yaml` for one-off verifier fixes.
