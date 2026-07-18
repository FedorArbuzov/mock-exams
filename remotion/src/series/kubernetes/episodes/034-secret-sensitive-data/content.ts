import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "Secret";

export const AUDIO_SRC = "audio/kubernetes/034-secret-sensitive-data.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 77.06;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "Secret",
  "base64",
  "encryption at rest",
  "RBAC",
  "etcd",
  "Vault",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Where should passwords and tokens live in Kubernetes?",
  },
  {
    id: "define",
    text: "In a Secret, not a ConfigMap. A Secret is built for sensitive data - database passwords, API tokens, TLS keys. It looks like a ConfigMap, but Kubernetes treats it more carefully: it can be encrypted at rest, is kept out of most logs, and access is controlled through RBAC.",
  },
  {
    id: "failure",
    text: "But understand the catch. By default Secret values are only base64 encoded, not encrypted, inside etcd. Base64 is not security - anyone who can read the Secret can decode it. Real protection needs encryption at rest enabled and tight RBAC.",
  },
  {
    id: "check",
    text: "What beginners get wrong: committing Secrets to git, or printing them with kubectl get secret dash o yaml in a shared terminal. Also mounting a Secret as env vars, which can leak into crash dumps - files are often safer. Consider Vault or sealed-secrets.",
  },
  {
    id: "rule",
    text: "Rule to remember: base64 is not encryption - guard Secrets with RBAC.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
