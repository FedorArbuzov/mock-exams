import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "imagePullPolicy";

export const AUDIO_SRC = "audio/kubernetes/021-imagepullpolicy-when-a-new-image-is-pulled.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 68.02;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "imagePullPolicy",
  "IfNotPresent",
  "Always",
  "Never",
  "cached",
  "stale",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Why does your Pod still run old code after a deploy?",
  },
  {
    id: "define",
    text: "Often it is imagePullPolicy. This field tells the kubelet when to re-download an image. IfNotPresent uses the cached image if the node already has that tag. Always pulls every time a container starts. Never only uses what is local and never fetches.",
  },
  {
    id: "failure",
    text: "The gotcha: if you keep pushing the same tag, IfNotPresent sees the tag locally and skips the pull, so your new code never lands. Kubernetes defaults to Always only when the tag is latest, and to IfNotPresent otherwise. That surprises people who reuse a fixed tag for every build.",
  },
  {
    id: "check",
    text: "Practical fix: use unique, immutable tags per build so there is nothing stale to cache. If you must reuse a tag during development, set imagePullPolicy to Always. Confirm with kubectl describe pod that the image ID actually changed after rollout.",
  },
  {
    id: "rule",
    text: "Rule to remember: same tag plus IfNotPresent equals stale Pods.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
