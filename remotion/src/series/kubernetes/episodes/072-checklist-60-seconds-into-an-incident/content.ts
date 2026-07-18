import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "Incident checklist";

export const AUDIO_SRC = "audio/kubernetes/072-checklist-60-seconds-into-an-incident.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 79.75;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "get pods",
  "describe",
  "logs --previous",
  "endpoints",
  "rollout status",
  "incident",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Service is down - which commands in the first 60 seconds?",
  },
  {
    id: "define",
    text: "Follow a fixed four-step sweep so you never freeze. Get pods to classify, describe for the reason, logs for the app error, then check endpoints and rollout for the wiring.",
  },
  {
    id: "pitfall",
    text: "Step one: get pods dash o wide - Running and Ready, or CrashLoop/Pending/ImagePull? Step two: describe pod, read Events. Step three: logs, and logs dash dash previous if crash-looping. Step four: get endpoints and rollout status.",
  },
  {
    id: "check",
    text: "What beginners get wrong: jumping straight to logs when the Pod never started, or restarting things blindly before reading a single Event. Order matters: status classifies, describe explains, logs confirm, endpoints catch wiring.",
  },
  {
    id: "rule",
    text: "Rule to remember: get, describe, logs, endpoints - four commands before you touch anything.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
