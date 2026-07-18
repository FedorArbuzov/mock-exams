import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "CrashLoop vs Error";

export const AUDIO_SRC = "audio/kubernetes/062-crashloopbackoff-vs-plain-error.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 74.83;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "CrashLoopBackOff",
  "Error",
  "exit code",
  "liveness",
  "logs --previous",
  "backoff",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Why is one failure just Error and another CrashLoopBackOff?",
  },
  {
    id: "define",
    text: "They describe two moments. Error means the container's current run exited with a failure and is not being retried right now. CrashLoopBackOff means it started, crashed, restarted, crashed again - and Kubernetes now inserts a growing delay between restarts.",
  },
  {
    id: "failure",
    text: "CrashLoop is not a root cause; it is a symptom of repeated crashes. The real reason is in the app - an unhandled exception on boot, a missing env var, a failing dependency, or a liveness probe killing a slow process.",
  },
  {
    id: "check",
    text: "What beginners get wrong: treating CrashLoopBackOff as the error itself and googling it forever, instead of reading why the process exits. Flow: logs dash dash previous for the last crash, describe for exit code and probe events.",
  },
  {
    id: "rule",
    text: "Rule to remember: CrashLoopBackOff is repeated crashing - read logs previous for the real cause.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
