import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "ServiceAccount";

export const AUDIO_SRC = "audio/kubernetes/035-serviceaccount-identity-for-a-pod.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 74.78;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "ServiceAccount",
  "RBAC",
  "token",
  "default",
  "least privilege",
  "Forbidden",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Whose identity does a Pod use to call the cluster API?",
  },
  {
    id: "define",
    text: "A ServiceAccount. Users authenticate as themselves, but Pods authenticate as a ServiceAccount. Every Pod gets one - if you do not set it, it uses the namespace's default. Kubernetes mounts a token into the Pod so code can talk to the API server as that identity.",
  },
  {
    id: "failure",
    text: "RBAC then decides what that identity may do. You bind a Role or ClusterRole to the ServiceAccount, granting exactly the verbs and resources it needs - list Pods, read a specific Secret, nothing more. That is least privilege for workloads.",
  },
  {
    id: "check",
    text: "What beginners get wrong: giving the default ServiceAccount broad cluster-admin rights, so every Pod becomes dangerous if compromised. Or wondering why a client gets Forbidden - the account lacks the RoleBinding. Use kubectl auth can-i to test, and dedicated accounts per app.",
  },
  {
    id: "rule",
    text: "Rule to remember: Pods act as a ServiceAccount - scope its RBAC tightly.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
