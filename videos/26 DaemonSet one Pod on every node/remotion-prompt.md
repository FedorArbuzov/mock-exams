Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: DaemonSet

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "DaemonSet"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: How do you put an agent on every node at once?
Scene 2: A DaemonSet. Instead of a replica count, it guarantees one Pod per matching node. Add a node to the cluster and the DaemonSet automatically schedules its Pod there. Remove the node and that Pod goes away. Perfect for log collectors, metrics agents, and networking plugins.
Scene 3: You can target a subset with a nodeSelector or tolerations - for example only Linux nodes, or only nodes labeled with GPUs. DaemonSet Pods often tolerate taints so they run even on control-plane nodes where normal workloads are blocked.
Scene 4: What beginners get wrong: using a Deployment with replicas equal to node count to fake this. That does not pin one Pod per node - the scheduler can stack two on one node and skip another. Only a DaemonSet gives the real guarantee. Check kubectl get daemonset for DESIRED and READY.
Scene 5: Rule to remember: one Pod on every node means DaemonSet, not replicas.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
