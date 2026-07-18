import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "kubectl get pods -A";

export const AUDIO_SRC = "audio/kubernetes/054-kubectl-get-pods-a-search-all-namespaces.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 74.59;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "-A",
  "all-namespaces",
  "NAMESPACE",
  "context",
  "empty get",
  "set-context",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Can't find the Pod - maybe the wrong namespace?",
  },
  {
    id: "define",
    text: "kubectl get pods dash A, or dash dash all-namespaces. It lists Pods across every namespace in one table, with a NAMESPACE column so you can see where each Pod actually lives.",
  },
  {
    id: "pitfall",
    text: "This is the classic morning mistake fix. Your context points at default, the app runs in staging or payments, and get pods looks empty. Dash A ends the guessing. Same flag works on deploy and svc too.",
  },
  {
    id: "check",
    text: "What beginners get wrong: running dash A on huge clusters without a filter. Or finding the namespace once, then forgetting to set it for the next commands. Tip: set-context namespace or pass dash n.",
  },
  {
    id: "rule",
    text: "Rule to remember: empty get often means wrong namespace - try dash A first.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
