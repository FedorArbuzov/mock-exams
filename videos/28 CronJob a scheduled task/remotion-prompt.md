Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: CronJob

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "CronJob"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: How do you automate a nightly backup in Kubernetes?
Scene 2: A CronJob. It is a Job on a schedule. You give it a cron expression, and at each tick it creates a fresh Job, which runs a Pod to completion. Great for backups, report generation, and periodic cleanup.
Scene 3: Two settings save you pain. concurrencyPolicy decides what happens if the previous run is still going - Allow, Forbid, or Replace. And startingDeadlineSeconds handles missed schedules when the controller was down. Kubernetes also keeps a history of successful and failed Jobs you can tune.
Scene 4: What beginners get wrong: expecting exact-second timing - CronJobs fire close to the schedule, not to the millisecond. Or leaving concurrencyPolicy at Allow for a slow backup, so overlapping runs pile up. Timezone bites too: older clusters run in UTC. Check kubectl get cronjob for LAST SCHEDULE.
Scene 5: Rule to remember: a CronJob just stamps out Jobs on a schedule - guard concurrency.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
