Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: kubectl get all

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "kubectl get all"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: Why does kubectl get all not show everything?
Scene 2: The name is misleading. kubectl get all only lists a small, common set of resource types in the current namespace - Pods, Services, Deployments, ReplicaSets, StatefulSets, and a few more. It deliberately skips a lot.
Scene 3: What it misses matters. ConfigMaps and Secrets are not there. Neither are Ingresses, PersistentVolumeClaims, ServiceAccounts, Roles, or custom resources. And cluster-scoped things like Nodes and PersistentVolumes never show, because get all is namespace-scoped.
Scene 4: What beginners get wrong: trusting get all as a full audit, then missing the ConfigMap or Secret causing the problem. Or forgetting cluster-scoped resources during cleanup. Tip: kubectl api-resources lists every type; query the ones you care about.
Scene 5: Rule to remember: get all is a shortlist, not an inventory.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
