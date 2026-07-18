import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "Rising RESTARTS";

export const AUDIO_SRC = "audio/kubernetes/065-why-restarts-keeps-growing.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 77.23;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "RESTARTS",
  "liveness",
  "OOMKilled",
  "memory limit",
  "logs --previous",
  "dependency",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "RESTARTS keeps climbing but STATUS still says Running - what now?",
  },
  {
    id: "define",
    text: "A growing RESTARTS count means the container has died and been recreated that many times. Even if it is Running now, each restart is a crash you should explain. Four common causes cover most cases.",
  },
  {
    id: "failure",
    text: "First, a failing liveness probe, so Kubernetes kills a container it thinks is unhealthy. Second, OOMKilled - it exceeded its memory limit. Third, the process itself crashes. Fourth, a dependency drops - a database or queue it cannot live without.",
  },
  {
    id: "check",
    text: "What beginners get wrong: ignoring restarts because the app looks up, or blaming Kubernetes when the app has a real memory leak. Flow: describe pod for OOMKilled and probe events, logs dash dash previous for the crash.",
  },
  {
    id: "rule",
    text: "Rule to remember: rising RESTARTS is never noise - check probes, OOM, and logs previous.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
