import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "Pod stuck Pending";

export const AUDIO_SRC = "audio/kubernetes/070-breakdown-why-a-pod-is-pending.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 84.6;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "Pending",
  "resources",
  "taints",
  "PVC",
  "affinity",
  "FailedScheduling",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Your Pod is stuck in Pending - where do you even start?",
  },
  {
    id: "define",
    text: "Pending almost always means the scheduler cannot place the Pod on any node. Walk a fixed order and you will find it fast: resources, taints, storage, affinity.",
  },
  {
    id: "failure",
    text: "First, node resources - if every node lacks the requested CPU or memory, it stays Pending. Second, taints without a matching toleration. Third, an unbound PersistentVolumeClaim. Fourth, affinity or nodeSelector rules too strict for any node.",
  },
  {
    id: "check",
    text: "What beginners get wrong: deleting and recreating the Pod, which changes nothing, or blaming the image when it never got scheduled. Flow: describe pod, read FailedScheduling - Insufficient cpu, untolerated taint, no volumes available.",
  },
  {
    id: "rule",
    text: "Rule to remember: Pending is scheduling - check resources, taints, PVC, affinity, then Events.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
