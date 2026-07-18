import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "Desired State";

export const AUDIO_SRC = "audio/kubernetes/010-desired-state-the-core-idea-of-kubernetes.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 76.51;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "desired state",
  "reconcile",
  "replicas",
  "controllers",
  "Deployment",
  "drift",
  "spec",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Why does Kubernetes fix drift by itself?",
  },
  {
    id: "define",
    text: "Because you declare desired state, and controllers continuously reconcile reality to match. You write a Deployment with replicas equals 3. Kubernetes stores that target. If a Pod crashes, the ReplicaSet controller notices only two Running and creates a replacement. You changed nothing manually. That loop is the core idea. You describe the end state in YAML. Watchers compare etcd to the world. Anything missing gets created. Anything extra gets cleaned up.",
  },
  {
    id: "reconcile",
    text: "What breaks: imperative kubectl run and manual edits fight the declarative model. You scale up by hand, a controller scales back down, and you think Kubernetes is broken. Beginners treat YAML as documentation instead of the contract.",
  },
  {
    id: "check",
    text: "Practical check: kubectl get deployment and kubectl get pods. Count Running Pods against desired replicas before editing the manifest again.",
  },
  {
    id: "rule",
    text: "Rule to remember: declare the end state. Let controllers fight drift for you.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
