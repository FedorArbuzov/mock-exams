import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "First kind cluster";

export const AUDIO_SRC = "audio/kubernetes/014-first-cluster-in-5-minutes-with-kind.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 75.31;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "kind",
  "kubectl",
  "Ready",
  "create cluster",
  "current-context",
  "Deployment",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "How do you get a working Kubernetes without the cloud?",
  },
  {
    id: "define",
    text: "With kind, you can stand up a local cluster in minutes. Install kind and kubectl, then run kind create cluster. When it finishes, your kubeconfig gains a new context pointing at that API server.",
  },
  {
    id: "proof",
    text: "First proof: kubectl get nodes. You want Ready. If the node is NotReady, stop and fix Docker or kind before applying apps. Second proof: kubectl get pods dash A. An empty list is fine - it means the API answers.",
  },
  {
    id: "check",
    text: "What breaks: people apply YAML while the node is still starting, then blame Kubernetes. Or they create a second kind cluster and wonder why kubectl talks to the wrong one. Always check kubectl config current-context after create. Practical flow: create, Ready nodes, one Deployment, then kind delete cluster when done.",
  },
  {
    id: "rule",
    text: "Rule to remember: Ready nodes first, workloads second.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
