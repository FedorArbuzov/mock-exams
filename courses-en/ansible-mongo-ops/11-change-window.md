# 11. Change windows

Never restart all `mongod` units at once.

```text
preflight              three active, mongodb_status converged, chrony
serial: 1 secondaries  restart mongod
wait                   member is SECONDARY, a PRIMARY still exists
stepDown               old PRIMARY becomes SECONDARY
restart that node
wait                   PRIMARY exists (mongodb_status)
```

`mongodb_stepdown` is the planned move. Restarting PRIMARY first is how you get an unplanned election in the middle of a window.

`rescue`: if a SECONDARY does not rejoin, **stop** — do not stepDown a healthy PRIMARY into a two-member mess you have not understood.

Next: [12. Lab: rolling](12-lab-rolling.md).
