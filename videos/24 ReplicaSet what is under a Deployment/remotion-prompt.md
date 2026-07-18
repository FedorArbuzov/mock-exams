Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: ReplicaSet

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "ReplicaSet"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: When you create a Deployment, who keeps the Pod count right?
Scene 2: A ReplicaSet. The Deployment is the manager that handles versions and rollouts, but under the hood it creates a ReplicaSet, and that ReplicaSet is the controller watching the number of Pods. If you ask for three and one dies, the ReplicaSet notices two Running and creates a replacement.
Scene 3: Here is the part that confuses people: during a rolling update you briefly have two ReplicaSets. The old one scales down while the new one scales up. That is why kubectl get replicasets sometimes shows several, most with zero Pods - those are previous revisions kept for rollback.
Scene 4: What beginners get wrong: deleting a ReplicaSet directly, or scaling it, while the Deployment owns it. The Deployment just recreates or overrides your change, because desired state lives one level up. Use kubectl get rs to see revisions - let the Deployment drive.
Scene 5: Rule to remember: Deployment manages versions, ReplicaSet guards the count.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
