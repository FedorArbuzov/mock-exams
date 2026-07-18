import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "kubectl logs --previous";

export const AUDIO_SRC = "audio/kubernetes/043-kubectl-logs-and-previous.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 75.79;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "kubectl logs",
  "--previous",
  "CrashLoopBackOff",
  "-c",
  "-f",
  "--tail",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "The container crashed and logs show nothing - now what?",
  },
  {
    id: "define",
    text: "Use dash dash previous. When a container restarts, the current logs belong to the fresh instance, which may be empty. The evidence of the crash lives in the previous container's logs. kubectl logs your-pod dash dash previous prints them.",
  },
  {
    id: "failure",
    text: "Know the other flags too. If a Pod has multiple containers, add dash c and the container name, or logs will complain. dash f follows live output. dash dash tail equals 100 limits volume. dash dash since equals 10m scopes to a time window.",
  },
  {
    id: "check",
    text: "What beginners get wrong: reading empty current logs during a CrashLoopBackOff and concluding there is nothing to see. Or forgetting dash c on a multi-container Pod and getting an error. Flow: rising RESTARTS, then logs dash dash previous reveals the stack trace.",
  },
  {
    id: "rule",
    text: "Rule to remember: crash loop means read dash dash previous, not the empty current log.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
