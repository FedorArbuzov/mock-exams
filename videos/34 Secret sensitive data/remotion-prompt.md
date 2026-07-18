Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: Secret

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "Secret"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: Where should passwords and tokens live in Kubernetes?
Scene 2: In a Secret, not a ConfigMap. A Secret is built for sensitive data - database passwords, API tokens, TLS keys. It looks like a ConfigMap, but Kubernetes treats it more carefully: it can be encrypted at rest, is kept out of most logs, and access is controlled through RBAC.
Scene 3: But understand the catch. By default Secret values are only base64 encoded, not encrypted, inside etcd. Base64 is not security - anyone who can read the Secret can decode it. Real protection needs encryption at rest enabled and tight RBAC.
Scene 4: What beginners get wrong: committing Secrets to git, or printing them with kubectl get secret dash o yaml in a shared terminal. Also mounting a Secret as env vars, which can leak into crash dumps - files are often safer. Consider Vault or sealed-secrets.
Scene 5: Rule to remember: base64 is not encryption - guard Secrets with RBAC.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
