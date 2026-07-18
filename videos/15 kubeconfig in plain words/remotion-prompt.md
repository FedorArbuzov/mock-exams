Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: kubeconfig

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "kubeconfig"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: What is that file without which kubectl stays silent?
Scene 2: kubeconfig is your phone book for clusters. It stores cluster API addresses, certificates or tokens for users, and named contexts that combine cluster plus user plus optional namespace. kubectl reads it, usually from your home directory under the kube folder, or from the KUBECONFIG environment variable.
Scene 3: What beginners get wrong: treating kubeconfig as magic. If the server URL is wrong, or the cert expired, every command fails with connection or unauthorized errors. Copying someone else kubeconfig without understanding it is how you accidentally point at production.
Scene 4: Practical checks: kubectl config view to see clusters and contexts. kubectl cluster-info to confirm you can reach the API. If auth fails, fix the user entry before debugging Pods that do not exist yet.
Scene 5: Rule to remember: kubeconfig is how kubectl finds the API - wrong file, wrong cluster.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
