import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "Namespace";

export const AUDIO_SRC = "audio/kubernetes/029-namespace-how-to-separate-environments.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 76.78;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "Namespace",
  "ResourceQuota",
  "RBAC",
  "NetworkPolicy",
  "default",
  "isolate",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "How do you keep dev and prod from colliding in one cluster?",
  },
  {
    id: "define",
    text: "Namespaces. A Namespace is a logical partition inside a single cluster. Names only have to be unique within a Namespace, so you can have a Service called api in dev and another called api in prod without a clash. It is the natural boundary for teams and environments.",
  },
  {
    id: "pitfall",
    text: "Namespaces also carry policy. You attach ResourceQuotas to cap CPU and memory, LimitRanges for defaults, and RBAC RoleBindings so a team only touches its own space. Network policies can isolate traffic between them.",
  },
  {
    id: "check",
    text: "What beginners get wrong: assuming Namespaces are a hard security wall. They are organizational, and Pods can still talk across them by default unless you add NetworkPolicies. Another trap: forgetting the namespace flag and creating resources in default. Use kubectl get ns and scope with dash n.",
  },
  {
    id: "rule",
    text: "Rule to remember: Namespaces organize a cluster - they do not fully isolate it.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
