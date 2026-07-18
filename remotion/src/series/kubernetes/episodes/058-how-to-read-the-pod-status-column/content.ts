import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "Pod STATUS column";

export const AUDIO_SRC = "audio/kubernetes/058-how-to-read-the-pod-status-column.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 71.66;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "STATUS",
  "Running",
  "Pending",
  "CrashLoopBackOff",
  "describe",
  "Events",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "What do Running, Pending, and CrashLoopBackOff mean?",
  },
  {
    id: "define",
    text: "The STATUS column is a short summary of a Pod's phase and current condition - the cluster's one-word answer to how are you. Running means containers are up. Pending means not scheduled or not ready. CrashLoopBackOff means the container keeps dying and Kubernetes is backing off.",
  },
  {
    id: "failure",
    text: "But STATUS is only a headline, not the story. It tells you something is wrong, not why. The reason lives in describe and Events, and the app-level detail lives in logs.",
  },
  {
    id: "check",
    text: "What beginners get wrong: treating STATUS as a full diagnosis and refreshing get pods hoping it flips. Or panicking at ContainerCreating, which is often a normal in-progress state. Flow: STATUS classifies, describe explains, logs confirm.",
  },
  {
    id: "rule",
    text: "Rule to remember: STATUS is the headline - describe and logs are the article.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
