import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "kubectl debug";

export const AUDIO_SRC = "audio/kubernetes/069-kubectl-debug-and-ephemeral-containers.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 78.74;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "kubectl debug",
  "ephemeral container",
  "distroless",
  "no shell",
  "target",
  "namespaces",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "No shell in the image - how do you debug inside the Pod?",
  },
  {
    id: "define",
    text: "kubectl debug. Modern images are often distroless or scratch - no shell, no curl - great for security but painful to inspect. An ephemeral container solves this: kubectl debug attaches a temporary container into a running Pod, sharing its process and network namespace.",
  },
  {
    id: "pitfall",
    text: "Now you get a full toolbox next to the failing app without rebuilding the image. Inspect processes, curl a dependency using the Pod's own network, or check the mounted filesystem - from a container carrying the tools the app left out.",
  },
  {
    id: "check",
    text: "What beginners get wrong: trying kubectl exec on a distroless image and getting no such file for sh. Or forgetting ephemeral containers are temporary and cannot be removed individually. Flow: debug dash dash image busybox dash dash target app.",
  },
  {
    id: "rule",
    text: "Rule to remember: no shell in the image means kubectl debug, not exec.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
