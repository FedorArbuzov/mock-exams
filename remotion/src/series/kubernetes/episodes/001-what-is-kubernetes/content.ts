import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/kubernetes/001-what-is-kubernetes.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 35.45;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "Kubernetes",
  "Containers",
  "containers",
  "Replicas",
  "replicas",
  "Desired State",
  "desired state",
  "Traffic",
  "traffic",
  "Scale",
  "scale",
  "Load Balancer",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "You have heard about Kubernetes, but what does it actually do?",
  },
  {
    id: "manage",
    text: "In simple terms, Kubernetes runs your containers automatically, keeps them healthy, and scales them when traffic grows.",
  },
  {
    id: "desired",
    text: "You define the desired state, for example: I need three replicas of this app.",
  },
  {
    id: "controller",
    text: "Kubernetes continuously works to keep the cluster in that state.",
  },
  {
    id: "crash",
    text: "If one container crashes, Kubernetes starts a new one.",
  },
  {
    id: "scale",
    text: "If traffic increases, you scale replicas and Kubernetes spreads the load.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
