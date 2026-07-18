Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: kubectl describe

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "kubectl describe"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: A Pod won't start - where do you look first?
Scene 2: kubectl describe. Where get shows status, describe shows the story. It prints the object's full configuration and, crucially, the Events at the bottom - the timeline of what the scheduler and kubelet actually tried and why it failed.
Scene 3: Those Events are gold. FailedScheduling means no node fit. ImagePullBackOff means the image could not be pulled. Unhealthy means a probe is failing. Back-off restarting means a crash loop. You read the reason instead of guessing.
Scene 4: What beginners get wrong: jumping straight to logs when the container never started, so logs are empty. describe would have shown the real blocker - a missing ConfigMap, an unschedulable Pod, or a failing readiness probe. Scroll to Events, newest first.
Scene 5: Rule to remember: describe first, read the Events, then dig deeper.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
