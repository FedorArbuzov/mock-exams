import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "Job";

export const AUDIO_SRC = "audio/kubernetes/027-job-a-one-shot-task.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 74.09;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "Job",
  "completion",
  "backoffLimit",
  "Complete",
  "migration",
  "parallelism",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "How do you run a task once and have it actually finish?",
  },
  {
    id: "define",
    text: "A Job. Unlike a Deployment, which keeps Pods running forever, a Job runs a Pod to completion and records success or failure. When the container exits zero, the Job is Complete. If it fails, the Job retries up to backoffLimit before giving up.",
  },
  {
    id: "pitfall",
    text: "Jobs can run in parallel too, with completions and parallelism, useful for batch work like processing a queue. Each attempt is a Pod, so you can read logs from every try.",
  },
  {
    id: "check",
    text: "What beginners get wrong: running a migration in a Deployment, which restarts it endlessly - the migration reruns every restart. Or seeing a Job Pod in Completed state and thinking it crashed. Completed is the goal. Check kubectl get jobs for COMPLETIONS, and clean up with ttlSecondsAfterFinished.",
  },
  {
    id: "rule",
    text: "Rule to remember: run-once work belongs in a Job, and Completed means success.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
