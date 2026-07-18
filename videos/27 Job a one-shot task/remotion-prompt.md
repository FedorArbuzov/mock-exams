Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: Job

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "Job"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: How do you run a task once and have it actually finish?
Scene 2: A Job. Unlike a Deployment, which keeps Pods running forever, a Job runs a Pod to completion and records success or failure. When the container exits zero, the Job is Complete. If it fails, the Job retries up to backoffLimit before giving up.
Scene 3: Jobs can run in parallel too, with completions and parallelism, useful for batch work like processing a queue. Each attempt is a Pod, so you can read logs from every try.
Scene 4: What beginners get wrong: running a migration in a Deployment, which restarts it endlessly - the migration reruns every restart. Or seeing a Job Pod in Completed state and thinking it crashed. Completed is the goal. Check kubectl get jobs for COMPLETIONS, and clean up with ttlSecondsAfterFinished.
Scene 5: Rule to remember: run-once work belongs in a Job, and Completed means success.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
