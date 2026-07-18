import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "Declarative vs Imperative";

export const AUDIO_SRC = "audio/kubernetes/039-declarative-vs-imperative-approach.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 79.7;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "declarative",
  "imperative",
  "apply",
  "kubectl run",
  "Git",
  "idempotent",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Should you write YAML files or fire kubectl by hand?",
  },
  {
    id: "define",
    text: "Both have a place. Imperative means you tell Kubernetes the exact action - kubectl run, kubectl create, kubectl scale. Fast for experiments. Declarative means you write a manifest describing the desired end state and run kubectl apply. Kubernetes figures out the diff and makes reality match.",
  },
  {
    id: "pitfall",
    text: "For anything real, declarative wins. Your YAML lives in Git, so you get history, review, and rollback. Re-running apply is safe and idempotent. Imperative changes vanish from memory - nobody knows why prod looks the way it does.",
  },
  {
    id: "check",
    text: "What beginners get wrong: building a cluster with a pile of imperative commands, then being unable to recreate it. Or mixing both, so a hand-edit gets overwritten by the next apply. Tip: generate YAML with dash dash dry-run equals client dash o yaml, then commit and manage it declaratively.",
  },
  {
    id: "rule",
    text: "Rule to remember: imperative to explore, declarative to operate.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
