Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: Selectors

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "Selectors"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: How does a Service know which Pods should get traffic?
Scene 2: Selectors. A selector is a query over labels. A Service says selector app equals api, and Kubernetes continuously finds every Pod with that label and adds it to the Service's Endpoints. There is no manual wiring - matching labels is the whole mechanism.
Scene 3: The same idea links controllers to Pods. A Deployment's selector must match the labels in its Pod template, or the API rejects it. ReplicaSets, DaemonSets, and NetworkPolicies all select by label too.
Scene 4: What breaks: the classic empty Endpoints. Your Service selector says app equals api but the Pods are labeled with different casing, or a typo. The Service has a ClusterIP and routes to nothing. Check kubectl get endpoints and compare with kubectl get pods dash dash show-labels.
Scene 5: Rule to remember: no matching labels, no Endpoints, no traffic.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
