import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "Job Completed";

export const AUDIO_SRC = "audio/kubernetes/064-job-completed-is-normal.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 77.81;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "Job",
  "Completed",
  "exit code",
  "restartPolicy",
  "Failed",
  "COMPLETIONS",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Your Job shows Completed and the Pod is gone - did it break?",
  },
  {
    id: "define",
    text: "No - for a Job, Completed is success. Unlike a Deployment, a Job is meant to run to the end and stop. Its Pod finishing with exit code zero is the goal. A Deployment Pod that exits restarts forever; a Job Pod that exits cleanly is done on purpose.",
  },
  {
    id: "pitfall",
    text: "This trips people up because the app mental model says a stopped Pod is bad. For batch work - a migration, a backup, a one-time import - stopping is the whole point.",
  },
  {
    id: "check",
    text: "What beginners get wrong: panicking that the Pod disappeared, or setting restartPolicy Always on a Job, which is invalid - Jobs use OnFailure or Never. Also confusing Completed with Failed. Check: get jobs shows COMPLETIONS one of one.",
  },
  {
    id: "rule",
    text: "Rule to remember: for a Job, Completed means it worked - only Failed is a problem.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
