Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: CrashLoop vs Error

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "CrashLoop vs Error"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: Why is one failure just Error and another CrashLoopBackOff?
Scene 2: They describe two moments. Error means the container's current run exited with a failure and is not being retried right now. CrashLoopBackOff means it started, crashed, restarted, crashed again - and Kubernetes now inserts a growing delay between restarts.
Scene 3: CrashLoop is not a root cause; it is a symptom of repeated crashes. The real reason is in the app - an unhandled exception on boot, a missing env var, a failing dependency, or a liveness probe killing a slow process.
Scene 4: What beginners get wrong: treating CrashLoopBackOff as the error itself and googling it forever, instead of reading why the process exits. Flow: logs dash dash previous for the last crash, describe for exit code and probe events.
Scene 5: Rule to remember: CrashLoopBackOff is repeated crashing - read logs previous for the real cause.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
