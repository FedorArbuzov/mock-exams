Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: kubectl delete

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "kubectl delete"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: You deleted a Pod and it came right back - why?
Scene 2: Because a controller owns it. A Deployment, ReplicaSet, StatefulSet, or DaemonSet watches desired replicas and recreates missing Pods. Deleting the Pod alone is temporary - the controller sees the gap and schedules a replacement within seconds.
Scene 3: What you should delete depends on the goal. To remove an app, delete the Deployment or the owning resource, not a single Pod. To force a restart, deleting a Pod is fine - that is intentional recreation. To clean up a Job's finished Pods, delete the Job.
Scene 4: What beginners get wrong: deleting Pods in a loop fighting a Deployment, or deleting a Service but leaving the Deployment running. Also using dash dash force casually - that skips graceful shutdown. Tip: check ownerReferences, or delete the Deployment.
Scene 5: Rule to remember: delete the controller, not the Pod, unless you want a restart.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
