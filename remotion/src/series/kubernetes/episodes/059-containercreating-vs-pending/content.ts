import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "ContainerCreating vs Pending";

export const AUDIO_SRC = "audio/kubernetes/059-containercreating-vs-pending.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 75.43;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "Pending",
  "ContainerCreating",
  "scheduler",
  "PVC",
  "image pull",
  "Events",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Your Pod is not Running yet - is that already a failure?",
  },
  {
    id: "define",
    text: "Usually no. Pending and ContainerCreating are two different early stages, both normal for a few seconds. Pending means the scheduler has not placed the Pod yet. ContainerCreating means it has a node and the kubelet is pulling the image and mounting volumes.",
  },
  {
    id: "failure",
    text: "Pending points at scheduling: no node has enough CPU or memory, taints block it, or a PVC is unbound. ContainerCreating stuck points at image pull, volume mounts, or CNI networking.",
  },
  {
    id: "check",
    text: "What beginners get wrong: deleting Pods that are simply Pending for resources, which changes nothing. Or assuming ContainerCreating is stuck when it is just pulling a large image. Check: kubectl describe pod, read Events.",
  },
  {
    id: "rule",
    text: "Rule to remember: Pending is a scheduling problem, ContainerCreating is a startup problem.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
