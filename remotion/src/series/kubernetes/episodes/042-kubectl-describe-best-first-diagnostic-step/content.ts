import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "kubectl describe";

export const AUDIO_SRC = "audio/kubernetes/042-kubectl-describe-best-first-diagnostic-step.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 73.3;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "kubectl describe",
  "Events",
  "FailedScheduling",
  "ImagePullBackOff",
  "probe",
  "logs",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "A Pod won't start - where do you look first?",
  },
  {
    id: "define",
    text: "kubectl describe. Where get shows status, describe shows the story. It prints the object's full configuration and, crucially, the Events at the bottom - the timeline of what the scheduler and kubelet actually tried and why it failed.",
  },
  {
    id: "failure",
    text: "Those Events are gold. FailedScheduling means no node fit. ImagePullBackOff means the image could not be pulled. Unhealthy means a probe is failing. Back-off restarting means a crash loop. You read the reason instead of guessing.",
  },
  {
    id: "check",
    text: "What beginners get wrong: jumping straight to logs when the container never started, so logs are empty. describe would have shown the real blocker - a missing ConfigMap, an unschedulable Pod, or a failing readiness probe. Scroll to Events, newest first.",
  },
  {
    id: "rule",
    text: "Rule to remember: describe first, read the Events, then dig deeper.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
