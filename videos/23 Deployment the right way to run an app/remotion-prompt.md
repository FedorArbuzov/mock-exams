Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: Deployment

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "Deployment"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: Why shouldn't you create Pods by hand in Kubernetes?
Scene 2: Because a bare Pod has no safety net. If it dies, or its node fails, nothing brings it back. A Deployment fixes that. You declare how many replicas you want and which image to run, and the Deployment keeps that many healthy Pods alive, rescheduling them when nodes disappear.
Scene 3: It also owns updates. Change the image tag and apply, and the Deployment rolls out gradually - new Pods come up, old Pods drain, and it stops if the new version fails readiness. You get rollback for free with kubectl rollout undo.
Scene 4: What beginners get wrong: running kubectl run for real apps, then wondering why traffic drops after a crash. Or editing a live Pod instead of the Deployment template, so the change vanishes on the next rollout. Check with kubectl get deployment for READY, and kubectl rollout status to watch a deploy finish.
Scene 5: Rule to remember: never run Pods raw - let a Deployment own them.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
