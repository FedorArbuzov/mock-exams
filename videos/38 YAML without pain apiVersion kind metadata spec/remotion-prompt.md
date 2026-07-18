Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: YAML basics

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "YAML basics"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: Why can one bad indent break your whole deploy?
Scene 2: Because Kubernetes YAML is structure, not decoration. Almost every manifest has four blocks. apiVersion says which API group and version. kind says what object it is - Deployment, Service, ConfigMap. metadata carries the name, namespace, and labels. spec is the desired state you want the cluster to reach.
Scene 3: YAML uses indentation to express nesting, and it must be spaces, never tabs. One misaligned line moves a field into the wrong parent, so containers ends up outside the template, or ports lands under the wrong key. The API then rejects it, or silently ignores the misplaced field.
Scene 4: What beginners get wrong: copying snippets with mixed tabs and spaces, or guessing which fields nest where. Also confusing kind casing - it is Deployment, not deployment. Use kubectl apply dash dash dry-run equals client to validate, and kubectl explain to see what nests where.
Scene 5: Rule to remember: apiVersion, kind, metadata, spec - spaces only, structure is everything.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
