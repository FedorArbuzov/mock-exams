import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "5 morning commands";

export const AUDIO_SRC = "audio/kubernetes/057-mini-routine-5-morning-commands.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 83.98;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "get nodes",
  "get pods -A",
  "events",
  "kubectl top",
  "rollout status",
  "on-call",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "What should an on-call engineer check first each morning?",
  },
  {
    id: "define",
    text: "A five-command routine. First, kubectl get nodes. Second, kubectl get pods dash A - scan CrashLoop and Pending. Third, kubectl get events sorted by lastTimestamp. Fourth, kubectl top if Metrics Server is there. Fifth, rollout status on critical Deployments.",
  },
  {
    id: "pitfall",
    text: "That sequence answers: are nodes healthy, are workloads up, what broke recently, is capacity tight, did last night's deploy finish.",
  },
  {
    id: "check",
    text: "What beginners get wrong: opening twelve dashboards before a single kubectl get, or checking only one namespace while another burns. Tip: save these as a shell alias matching your service map.",
  },
  {
    id: "rule",
    text: "Rule to remember: nodes, pods, events, top, rollouts - five checks, then dig deeper.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
