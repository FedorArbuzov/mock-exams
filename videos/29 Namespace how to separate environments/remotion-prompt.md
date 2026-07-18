Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: Namespace

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "Namespace"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: How do you keep dev and prod from colliding in one cluster?
Scene 2: Namespaces. A Namespace is a logical partition inside a single cluster. Names only have to be unique within a Namespace, so you can have a Service called api in dev and another called api in prod without a clash. It is the natural boundary for teams and environments.
Scene 3: Namespaces also carry policy. You attach ResourceQuotas to cap CPU and memory, LimitRanges for defaults, and RBAC RoleBindings so a team only touches its own space. Network policies can isolate traffic between them.
Scene 4: What beginners get wrong: assuming Namespaces are a hard security wall. They are organizational, and Pods can still talk across them by default unless you add NetworkPolicies. Another trap: forgetting the namespace flag and creating resources in default. Use kubectl get ns and scope with dash n.
Scene 5: Rule to remember: Namespaces organize a cluster - they do not fully isolate it.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
