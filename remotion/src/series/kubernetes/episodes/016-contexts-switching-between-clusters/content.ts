import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "kubectl contexts";

export const AUDIO_SRC = "audio/kubernetes/016-contexts-switching-between-clusters.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 68.45;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "context",
  "use-context",
  "current-context",
  "namespace",
  "apply",
  "get-contexts",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "How do you work with multiple clusters using one kubectl?",
  },
  {
    id: "define",
    text: "A context is a named pointer: which cluster, which user credentials, and often which default namespace. You keep many contexts in one kubeconfig, then switch with kubectl config use-context. Listing them is kubectl config get-contexts. The star marks the current one.",
  },
  {
    id: "switch",
    text: "What breaks: you apply a Deployment thinking you are on kind, but the current context is staging. The command succeeds, and you just shipped to the wrong place. Context mistakes look like success in the terminal.",
  },
  {
    id: "check",
    text: "Practical habit: before any apply, delete, or scale, run kubectl config current-context. Say the name out loud. For day-to-day work, also set a clear namespace with kubectl config set-context --current --namespace equals my-app, so get pods does not surprise you with empty output in default.",
  },
  {
    id: "rule",
    text: "Rule to remember: context chooses the cluster - check it before every write.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
