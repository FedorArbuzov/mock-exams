# labctl

Python lab engine for [`kuber-cka`](../courses-en/kuber-cka/README.md). It prepares a **real** Kubernetes cluster, checks prerequisites, grades the **resulting** state, and cleans up.

This is not a Kubernetes simulator. It talks to the cluster through `kubectl` and to nodes through Ansible / SSH / `lxc exec`.

```text
prepare → validate initial state → show task → student work → verify → score → cleanup
```

## Install

From the repository root (same machine where `kubectl` reaches the Kubespray cluster — usually WSL or the 16 GB Ubuntu box):

```bash
pip install -r labctl/requirements.txt
export KUBECONFIG=$HOME/.kube/kuber-cka.conf
export LABCTL_MODE=training   # or cka / oncall
```

`mockctl web` **Start / Check / Cleanup** call this engine when a lesson has `"backend": "labctl"`.

## Commands

```bash
python -m labctl status
python -m labctl start --lab cka-01-pod
python -m labctl task  --lab cka-01-pod
python -m labctl check --lab cka-01-pod
python -m labctl hint  --lab cka-01-pod   # training mode only
python -m labctl cleanup --lab cka-01-pod
```

`--json` prints the same payload the courses UI uses.

## Modes

| Mode | Env | What the student sees |
|------|-----|------------------------|
| `training` | `LABCTL_MODE=training` | Hints on request, explanation + root cause after a pass |
| `cka` | `LABCTL_MODE=cka` | Task only. After check: `PASSED` + score |
| `oncall` | `LABCTL_MODE=oncall` | Ticket text. Incidents stay sequential |

Progress is stored in `~/.labctl/progress.json`. Labs unlock in catalog order. Authors can set `LABCTL_ALLOW_SKIP=1`.

## Definitions

Each lab is YAML under `courses-en/kuber-cka/labs/`. Order and unlocks live in `catalog.yaml`. Checks assert **cluster state**, never command history.
