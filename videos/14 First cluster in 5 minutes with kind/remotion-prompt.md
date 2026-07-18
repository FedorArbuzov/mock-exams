Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: First kind cluster

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "First kind cluster"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: How do you get a working Kubernetes without the cloud?
Scene 2: With kind, you can stand up a local cluster in minutes. Install kind and kubectl, then run kind create cluster. When it finishes, your kubeconfig gains a new context pointing at that API server.
Scene 3: First proof: kubectl get nodes. You want Ready. If the node is NotReady, stop and fix Docker or kind before applying apps. Second proof: kubectl get pods across all namespaces. An empty list is fine - it means the API answers.
Scene 4: What breaks: people apply YAML while the node is still starting, then blame Kubernetes. Or they create a second kind cluster and wonder why kubectl talks to the wrong one. Always check kubectl config current-context after create. Practical flow: create, Ready nodes, one Deployment, then kind delete cluster when done.
Scene 5: Rule to remember: Ready nodes first, workloads second.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
