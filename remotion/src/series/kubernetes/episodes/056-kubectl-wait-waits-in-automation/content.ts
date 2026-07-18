import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "kubectl wait";

export const AUDIO_SRC = "audio/kubernetes/056-kubectl-wait-waits-in-automation.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 70.2;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "kubectl wait",
  "condition",
  "timeout",
  "CI",
  "Available",
  "rollout status",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "How do you avoid sleep loops in CI scripts?",
  },
  {
    id: "define",
    text: "kubectl wait. It blocks until a resource reaches a condition you name, then exits success or times out. Instead of sleep sixty and hope, you wait for condition equals Available on a Deployment with an explicit timeout.",
  },
  {
    id: "pitfall",
    text: "That is the right pattern for pipelines. Wait for a Job to complete, a Pod to be Ready, or a rollout to finish before the next step runs tests. Timeouts fail the job clearly when the cluster never gets healthy.",
  },
  {
    id: "check",
    text: "What beginners get wrong: sleeping fixed amounts that are too short or too long. Or waiting on the wrong condition. Tip: pair wait with rollout status, and always set an explicit timeout.",
  },
  {
    id: "rule",
    text: "Rule to remember: wait on conditions, do not sleep and pray.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
