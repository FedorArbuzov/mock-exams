import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "kubectl diff";

export const AUDIO_SRC = "audio/kubernetes/050-kubectl-diff-preview-changes-before-apply.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 70.58;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "kubectl diff",
  "preview",
  "apply",
  "unified diff",
  "CI",
  "prod",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "How do you see what will change before you apply?",
  },
  {
    id: "define",
    text: "kubectl diff. It compares your local manifest to the live object and prints a unified diff of what apply would change. You get a preview without mutating the cluster.",
  },
  {
    id: "pitfall",
    text: "Use it as a safety gate. Before a production apply, run kubectl diff dash f manifest.yaml and read every red and green line. Unexpected deletions, image swaps, or replica jumps stand out immediately.",
  },
  {
    id: "check",
    text: "What beginners get wrong: applying blind because the YAML looks familiar. Or ignoring that diff needs RBAC - if it fails, fix permissions instead of skipping. Tip: review namespace and name carefully.",
  },
  {
    id: "rule",
    text: "Rule to remember: diff first, apply second - never fly blind into prod.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
