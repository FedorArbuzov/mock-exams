import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "CronJob";

export const AUDIO_SRC = "audio/kubernetes/028-cronjob-a-scheduled-task.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 78.05;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "CronJob",
  "schedule",
  "concurrencyPolicy",
  "Job",
  "backup",
  "UTC",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "How do you automate a nightly backup in Kubernetes?",
  },
  {
    id: "define",
    text: "A CronJob. It is a Job on a schedule. You give it a cron expression, and at each tick it creates a fresh Job, which runs a Pod to completion. Great for backups, report generation, and periodic cleanup.",
  },
  {
    id: "pitfall",
    text: "Two settings save you pain. concurrencyPolicy decides what happens if the previous run is still going - Allow, Forbid, or Replace. And startingDeadlineSeconds handles missed schedules when the controller was down. Kubernetes also keeps a history of successful and failed Jobs you can tune.",
  },
  {
    id: "check",
    text: "What beginners get wrong: expecting exact-second timing - CronJobs fire close to the schedule, not to the millisecond. Or leaving concurrencyPolicy at Allow for a slow backup, so overlapping runs pile up. Timezone bites too: older clusters run in UTC. Check kubectl get cronjob for LAST SCHEDULE.",
  },
  {
    id: "rule",
    text: "Rule to remember: a CronJob just stamps out Jobs on a schedule - guard concurrency.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
