import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "kubectl get -o wide";

export const AUDIO_SRC = "audio/kubernetes/053-kubectl-get-o-wide-wider-overview.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 74.4;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "-o wide",
  "node",
  "pod IP",
  "columns",
  "diagnostics",
  "get pods",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Need node, IP, or extra fields fast?",
  },
  {
    id: "define",
    text: "kubectl get dash o wide. The default table is compact. Wide mode adds the columns you actually use while debugging - for Pods that often means node name, pod IP, and details the short view hides.",
  },
  {
    id: "pitfall",
    text: "Why it helps: you see which node a Pod landed on without describe, spot IP issues, and correlate with node problems. For nodes, wide may show runtime and OS fields. Same get command, more signal.",
  },
  {
    id: "check",
    text: "What beginners get wrong: staring at default columns during an incident, then running ten describes. Wide is still not full YAML - use dash o yaml for that. Alias get pods dash o wide.",
  },
  {
    id: "rule",
    text: "Rule to remember: when the table feels thin, add dash o wide before you dig deeper.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
