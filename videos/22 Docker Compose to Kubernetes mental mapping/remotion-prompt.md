Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: Compose to Kubernetes

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "Compose to Kubernetes"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: You have a docker-compose file - how do you think in Kubernetes?
Scene 2: Map the concepts, do not translate line by line. A Compose service becomes a Deployment that runs your Pods, plus a Service that gives them a stable network name. Container ports map to a Service port. depends_on has no direct twin - Kubernetes relies on readiness probes and retries instead.
Scene 3: Keep going: named volumes become PersistentVolumeClaims. The environment block splits into a ConfigMap for plain settings and a Secret for sensitive values. A shared Compose network is roughly the flat Pod network inside one namespace, where Pods reach each other by Service name.
Scene 4: What breaks: people expect docker compose up ordering and one host. Kubernetes spreads Pods across nodes, restarts them, and gives no guaranteed start order. Design for that: health checks, not sleep.
Scene 5: Rule to remember: service is Deployment plus Service, volumes are PVCs, env is ConfigMap and Secret.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
