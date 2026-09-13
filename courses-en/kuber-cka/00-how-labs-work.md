# 00. How labs work

The courses UI is the same as every other track: you read markdown here. The difference is the **lab engine** (`labctl`). It talks to **your** cluster.

```text
prepare
   ↓
validate initial state
   ↓
show task
   ↓
you investigate / implement
   ↓
verify  (result only)
   ↓
score
   ↓
cleanup / reset
```

## Interactive lab panel

On a lab page, **Start lab** / **Check** / **Cleanup** call `labctl`. Same loop from a terminal:

```bash
export KUBECONFIG=$HOME/.kube/kuber-cka.conf
export LABCTL_MODE=training

python -m labctl start --lab cka-01-pod
python -m labctl check --lab cka-01-pod
python -m labctl cleanup --lab cka-01-pod
python -m labctl status
```

If Start refuses, **do not continue**. Example:

```text
Cannot start lab.

Reason:
worker-02 is NotReady.
```

Fix the cluster (or finish the previous lab), then Start again.

## What Check looks at

Check reads **live state**: objects, conditions, EndpointSlices, DNS, HTTP from a probe Pod, systemd on a node when the lab needs it.

It does **not** read your shell history. Any correct fix is a pass.

Training mode may print an explanation **after** you pass. CKA mode prints:

```text
PASSED
Score: 8/10
```

## Progress

Labs unlock in catalog order. Already passed labs stay `✓`. The next one is `→`. The rest are `🔒`.

ON-CALL incidents are the same rule: **01 → 02 → … → 20**. No random incident.

The [mock exam](99-mock-exam.md) is a separate mode. It does not unlock from the main chain and does not skip you ahead.

## Snapshots

There is no hypervisor snapshot of the whole cluster. Cleanup must put the cluster back: delete the lab namespace, restore kubelet / containerd / sysctl / `tc`, remove fill files, uncordon.

If Cleanup fails mid-break (you stopped kubelet and closed the laptop), run:

```bash
python -m labctl cleanup --lab <that-lab>
```

or `LABCTL_ALLOW_SKIP=1 python -m labctl start --lab cka-01-pod` only when you are the author resetting a stand.

Next: [01. Why this path](01-why-this-path.md).
