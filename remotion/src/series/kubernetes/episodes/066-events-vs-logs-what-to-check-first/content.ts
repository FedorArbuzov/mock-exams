import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "Events vs Logs";

export const AUDIO_SRC = "audio/kubernetes/066-events-vs-logs-what-to-check-first.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 76.3;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "Events",
  "logs",
  "orchestration",
  "describe",
  "--previous",
  "Pending",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Empty logs mean there is no problem, right?",
  },
  {
    id: "define",
    text: "Wrong - and that assumption wastes hours. Events are Kubernetes talking about orchestration: scheduling, image pulls, probes, mounts, killings. Logs are your application talking - the code's output once the process is actually alive.",
  },
  {
    id: "pitfall",
    text: "If the container never started, logs are empty - not because things are fine, but because there was nothing to log. The answer was in Events the whole time.",
  },
  {
    id: "check",
    text: "Rule: if the Pod is not Running - Pending, ImagePullBackOff, ConfigError - read Events first via describe. If it is Running or crashing after start, read logs, adding dash dash previous for the last crash.",
  },
  {
    id: "rule",
    text: "Rule to remember: not started yet means Events; started then failed means logs.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
