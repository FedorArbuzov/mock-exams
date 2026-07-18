import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "ImagePullBackOff";

export const AUDIO_SRC = "audio/kubernetes/060-errimagepull-and-imagepullbackoff.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 75.86;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "ErrImagePull",
  "ImagePullBackOff",
  "tag",
  "imagePullSecret",
  "registry",
  "rate limit",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Why won't your container image download?",
  },
  {
    id: "define",
    text: "That is ErrImagePull, and after retries it becomes ImagePullBackOff - Kubernetes backing off before trying again. The container never starts because the kubelet cannot fetch the image. The fix is almost always one of four things.",
  },
  {
    id: "failure",
    text: "First, the name or tag is wrong. Second, the registry is private and you have no valid imagePullSecret. Third, the node cannot reach the registry - DNS or egress blocked. Fourth, you hit a rate limit, classic with anonymous Docker Hub.",
  },
  {
    id: "check",
    text: "What beginners get wrong: staring at logs, which are empty because no container ran. Flow: kubectl describe pod and read the Events line - it says manifest unknown, unauthorized, or no such host.",
  },
  {
    id: "rule",
    text: "Rule to remember: ImagePullBackOff is a fetch problem - check name, tag, secret, network.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
