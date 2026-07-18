import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "kubeconfig";

export const AUDIO_SRC = "audio/kubernetes/015-kubeconfig-in-plain-words.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 69.26;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "kubeconfig",
  "cluster",
  "user",
  "context",
  "kubectl",
  "unauthorized",
  "KUBECONFIG",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "What is that file without which kubectl stays silent?",
  },
  {
    id: "define",
    text: "kubeconfig is your phone book for clusters. It stores cluster API addresses, certificates or tokens for users, and named contexts that combine cluster plus user plus optional namespace. kubectl reads it, usually from your home directory under the kube folder, or from the KUBECONFIG environment variable.",
  },
  {
    id: "parts",
    text: "What beginners get wrong: treating kubeconfig as magic. If the server URL is wrong, or the cert expired, every command fails with connection or unauthorized errors. Copying someone else kubeconfig without understanding it is how you accidentally point at production.",
  },
  {
    id: "check",
    text: "Practical checks: kubectl config view to see clusters and contexts. kubectl cluster-info to confirm you can reach the API. If auth fails, fix the user entry before debugging Pods that do not exist yet.",
  },
  {
    id: "rule",
    text: "Rule to remember: kubeconfig is how kubectl finds the API - wrong file, wrong cluster.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
