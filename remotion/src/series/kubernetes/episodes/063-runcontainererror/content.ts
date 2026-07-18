import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "RunContainerError";

export const AUDIO_SRC = "audio/kubernetes/063-runcontainererror.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 79.63;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "RunContainerError",
  "command",
  "args",
  "volumeMount",
  "permissions",
  "entrypoint",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Image pulled, config fine, but the container still won't run?",
  },
  {
    id: "define",
    text: "That is RunContainerError. The runtime accepted the config but failed at the moment of actually starting the process. The image and spec are valid enough to try - the failure is in how the container is launched.",
  },
  {
    id: "failure",
    text: "Common causes: the command or args point to a binary not in the image, so exec fails. A volume mount is broken - a path collision, a read-only filesystem, or a missing hostPath. Or filesystem permissions block the entrypoint.",
  },
  {
    id: "check",
    text: "What beginners get wrong: confusing this with CrashLoopBackOff. There the process runs then crashes; here it never starts. Flow: describe pod names the path or exec error; verify command, entrypoint, and every mount.",
  },
  {
    id: "rule",
    text: "Rule to remember: RunContainerError means the start failed - check command, mounts, and permissions.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
