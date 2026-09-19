# 09. stepDown vs kill PRIMARY

| | Planned stepDown | Failover |
|--|------------------|----------|
| PRIMARY | healthy | dead (`mongod` stopped / host gone) |
| Command | `mongodb_stepdown` / `rs.stepDown` | election — you wait, then write |
| When | patch window | incident |

`kill -9` / `systemctl stop mongod` on the PRIMARY while you still have two voters is how you **practice** failover. That is lesson [18b](18b-lab-primary-down.md). Do not mix the two tickets.

After stepDown, `nimbus-mongo` object plays must still find the new PRIMARY. Clients that pinned `mongo-01` break. We keep no proxy in front so you **feel** the PRIMARY move.

`mongodb_stepdown` is a no-op if the node is already SECONDARY. Target the current PRIMARY (discover it).

## Checklist

- [ ] You can say stepDown vs kill-PRIMARY in one sentence
- [ ] You will not `rs.freeze` “to be faster” without writing it down

Game day (PRIMARY process dead) is [18b](18b-lab-primary-down.md).

Next: [10. Lab: stepDown](10-lab-stepdown.md).
