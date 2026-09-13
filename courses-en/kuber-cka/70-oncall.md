# 70. ON-CALL

Twenty incidents. **Strict order.** No shuffle.

Set `LABCTL_MODE=oncall` (or stay in training — the ticket text is the same).

```text
setup → validate initial state → ticket → you fix → verify → score → cleanup → next
```

You do not move to ON-CALL 02 until 01 is resolved (unless you are the author with `LABCTL_ALLOW_SKIP=1`).

After a pass:

```text
Incident resolved.

Score: 27/30

Moving to ON-CALL 02...
```

These are production-shaped versions of skills you already practiced. The cluster is still real. The ticket will not name the root cause.

Next: [ON-CALL 01](71-lab-oncall-01.md).
