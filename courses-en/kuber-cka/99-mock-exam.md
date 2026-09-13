# 99. Final CKA mock

Separate **exam mode**. It does not sit in the sequential unlock chain. Use it after you have finished the course, or as a cold timed run.

```bash
export LABCTL_MODE=exam
export KUBECONFIG=$HOME/.kube/kuber-cka.conf
python -m labctl start --lab mock-exam
```

Start a **2 hour** timer yourself. The engine does not stop you.

## Rules

- Task text only. No hints, no root cause, no explanation after a task.
- You may use Kubernetes documentation (same spirit as the real exam).
- Check grades **all** mock tasks at once (result state).
- Cleanup returns the exam namespaces.

The task list appears after **Start** (`python -m labctl task --lab mock-exam`) and on this page once you press Start in the UI — read the ticket in the Interactive panel note.

Pass mark: **80 / 100**.

This mock does not replace [`mock-cka`](../mock-cka/README.md) (API speed on Docker Desktop) or [`mock-cka-kubeadm`](../mock-cka-kubeadm/README.md) (kubeadm-shaped timing).
