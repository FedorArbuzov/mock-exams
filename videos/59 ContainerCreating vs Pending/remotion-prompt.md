Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: ContainerCreating vs Pending

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "ContainerCreating vs Pending"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: Your Pod is not Running yet - is that already a failure?
Scene 2: Usually no. Pending and ContainerCreating are two different early stages, both normal for a few seconds. Pending means the scheduler has not placed the Pod yet. ContainerCreating means it has a node and the kubelet is pulling the image and mounting volumes.
Scene 3: Pending points at scheduling: no node has enough CPU or memory, taints block it, or a PVC is unbound. ContainerCreating stuck points at image pull, volume mounts, or CNI networking.
Scene 4: What beginners get wrong: deleting Pods that are simply Pending for resources, which changes nothing. Or assuming ContainerCreating is stuck when it is just pulling a large image. Check: kubectl describe pod, read Events.
Scene 5: Rule to remember: Pending is a scheduling problem, ContainerCreating is a startup problem.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
