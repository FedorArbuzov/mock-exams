Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: Ingress

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "Ingress"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: How do you route external traffic by domain and path?
Scene 2: Ingress. A Service can expose one app, but you do not want a LoadBalancer per app. Ingress is a single HTTP and HTTPS entry point with rules: host api dot example dot com goes to the api Service, path slash app goes to the frontend Service. It also terminates TLS in one place.
Scene 3: But Ingress is only rules. Nothing happens without an Ingress Controller - like NGINX, Traefik, or a cloud one - actually running in the cluster to read those rules and route traffic. The Ingress object is the config; the controller is the engine.
Scene 4: What beginners get wrong: creating an Ingress with no controller installed, then wondering why the address stays empty. Or forgetting the TLS Secret, so HTTPS fails. Path types trip people - Prefix versus Exact. Check kubectl get ingress for ADDRESS; confirm controller Pods run first.
Scene 5: Rule to remember: Ingress is rules - it needs a controller to do anything.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
