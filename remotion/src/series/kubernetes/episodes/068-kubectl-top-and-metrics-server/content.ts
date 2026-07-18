import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "kubectl top";

export const AUDIO_SRC = "audio/kubernetes/068-kubectl-top-and-metrics-server.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 78.46;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "kubectl top",
  "Metrics Server",
  "CPU",
  "memory",
  "requests",
  "limits",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "How do you see CPU and memory usage right in the CLI?",
  },
  {
    id: "define",
    text: "kubectl top. top nodes shows CPU and memory per node; top pods shows it per Pod. It is the fastest way to spot what is hot without a dashboard - perfect for catching a memory hog or a saturated node.",
  },
  {
    id: "pitfall",
    text: "But there is a catch: kubectl top needs Metrics Server installed. It scrapes the kubelets and serves live usage. Without it, top returns Metrics API not available - which confuses beginners into thinking the command is broken.",
  },
  {
    id: "check",
    text: "What beginners get wrong: expecting top on a fresh cluster, or confusing live usage with the requests and limits in YAML. top shows actual consumption now; requests and limits are your declared budget.",
  },
  {
    id: "rule",
    text: "Rule to remember: kubectl top shows live usage - but only when Metrics Server is running.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
