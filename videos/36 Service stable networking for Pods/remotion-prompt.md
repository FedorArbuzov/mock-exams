Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: Service

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "Service"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: Pods get new IPs - how do you give an app a stable address?
Scene 2: A Service. Pods are ephemeral; each restart gets a new IP. A Service gives you one stable virtual IP and a DNS name that never changes, then load-balances traffic to whichever Pods currently match its selector. Clients talk to the Service, not to individual Pods.
Scene 3: The default type is ClusterIP - reachable only inside the cluster, perfect for service-to-service calls. NodePort and LoadBalancer expose it outside. Behind the scenes the Service keeps an Endpoints list of healthy Pod IPs, updated as Pods come and go.
Scene 4: What breaks: the selector matches no Pods, so Endpoints is empty and connections hang. Or targetPort does not match the container's real port, so traffic reaches the Service but dies at the Pod. Check kubectl get endpoints and kubectl get svc.
Scene 5: Rule to remember: Pods are cattle with changing IPs - a Service is the stable front door.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
