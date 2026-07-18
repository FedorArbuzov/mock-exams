Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: ServiceAccount

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "ServiceAccount"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: Whose identity does a Pod use to call the cluster API?
Scene 2: A ServiceAccount. Users authenticate as themselves, but Pods authenticate as a ServiceAccount. Every Pod gets one - if you do not set it, it uses the namespace's default. Kubernetes mounts a token into the Pod so code can talk to the API server as that identity.
Scene 3: RBAC then decides what that identity may do. You bind a Role or ClusterRole to the ServiceAccount, granting exactly the verbs and resources it needs - list Pods, read a specific Secret, nothing more. That is least privilege for workloads.
Scene 4: What beginners get wrong: giving the default ServiceAccount broad cluster-admin rights, so every Pod becomes dangerous if compromised. Or wondering why a client gets Forbidden - the account lacks the RoleBinding. Use kubectl auth can-i to test, and dedicated accounts per app.
Scene 5: Rule to remember: Pods act as a ServiceAccount - scope its RBAC tightly.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
