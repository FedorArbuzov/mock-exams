import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "kubectl cp";

export const AUDIO_SRC = "audio/kubernetes/055-kubectl-cp-copy-files-to-and-from-a-pod.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 79.97;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "kubectl cp",
  "files",
  "container",
  "-c",
  "volume",
  "temporary",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "How do you pull a log file or config out of a container?",
  },
  {
    id: "define",
    text: "kubectl cp. It copies files between your machine and a Pod, similar to secure copy. kubectl cp my-pod colon path pulls a file down. Reverse the arguments to push a file into the Pod.",
  },
  {
    id: "pitfall",
    text: "Use cases: grab a crash dump, extract a generated config, or drop a temporary debug script. Specify the container with dash c when the Pod has more than one. Paths are container filesystem paths, not host paths.",
  },
  {
    id: "check",
    text: "What beginners get wrong: expecting cp on distroless images, copying huge folders, or treating pushed files as permanent - restarts wipe the container filesystem. Prefer volumes for lasting data.",
  },
  {
    id: "rule",
    text: "Rule to remember: kubectl cp is a temporary bridge - not your backup strategy.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
