import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "kubectl exec";

export const AUDIO_SRC = "audio/kubernetes/044-kubectl-exec-targeted-debug-inside-a-container.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 76.97;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "kubectl exec",
  "shell",
  "env",
  "DNS",
  "distroless",
  "kubectl debug",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "How do you inspect an app from inside its container?",
  },
  {
    id: "define",
    text: "kubectl exec. It runs a command inside a running container - perfect for quick diagnostics. kubectl exec dash it your-pod dash dash sh opens a shell. From there you check environment variables, curl a dependency, resolve DNS, or read a config file the app actually loaded.",
  },
  {
    id: "pitfall",
    text: "This is how you answer real questions. Is the ConfigMap mounted where the app expects? Can this Pod reach the database Service by name? What does env show for the injected settings? You are testing from the app's exact network and filesystem view.",
  },
  {
    id: "check",
    text: "What beginners get wrong: expecting bash in a minimal image that only has sh, or no shell in a distroless image. Also treating exec changes as permanent - anything you edit inside vanishes on restart. For images with no shell, use kubectl debug with an ephemeral container.",
  },
  {
    id: "rule",
    text: "Rule to remember: exec is for looking inside, not for making lasting changes.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
