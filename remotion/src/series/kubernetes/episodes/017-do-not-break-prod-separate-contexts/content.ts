import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "Protect prod context";

export const AUDIO_SRC = "audio/kubernetes/017-do-not-break-prod-separate-contexts.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 66.84;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "prod",
  "current-context",
  "apply",
  "kind-dev",
  "staging",
  "dry-run",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "How do you avoid deploying to prod by accident?",
  },
  {
    id: "define",
    text: "Separate contexts with loud names. Call them kind-dev, staging, and prod - never cluster-one and cluster-two. Color your shell prompt with the current context if you can. Never reuse the same short alias for local and production.",
  },
  {
    id: "habit",
    text: "What beginners get wrong: one shared context name after merging kubeconfig files, or running kubectl apply from muscle memory while Slack is distracting them. Production outages often start with a successful apply to the wrong cluster.",
  },
  {
    id: "check",
    text: "Practical checklist before apply: kubectl config current-context must show the expected name. kubectl get nodes should match the environment you think you are in. Prefer dry-run when unsure. For prod, confirm namespace, context, and change.",
  },
  {
    id: "rule",
    text: "Rule to remember: current-context before apply - every time, no exceptions.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
