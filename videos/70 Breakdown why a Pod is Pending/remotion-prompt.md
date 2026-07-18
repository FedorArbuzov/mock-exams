Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: Pod stuck Pending

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "Pod stuck Pending"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: Your Pod is stuck in Pending - where do you even start?
Scene 2: Pending almost always means the scheduler cannot place the Pod on any node. Walk a fixed order and you will find it fast: resources, taints, storage, affinity.
Scene 3: First, node resources - if every node lacks the requested CPU or memory, it stays Pending. Second, taints without a matching toleration. Third, an unbound PersistentVolumeClaim. Fourth, affinity or nodeSelector rules too strict for any node.
Scene 4: What beginners get wrong: deleting and recreating the Pod, which changes nothing, or blaming the image when it never got scheduled. Flow: describe pod, read FailedScheduling - Insufficient cpu, untolerated taint, no volumes available.
Scene 5: Rule to remember: Pending is scheduling - check resources, taints, PVC, affinity, then Events.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
