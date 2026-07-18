import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "Annotations";

export const AUDIO_SRC = "audio/kubernetes/032-annotations-operational-metadata.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 76.15;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "annotations",
  "labels",
  "metadata",
  "controllers",
  "Ingress",
  "select",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Where do you put metadata that must not affect selection?",
  },
  {
    id: "define",
    text: "Annotations. Like labels, they are key/value pairs on an object, but nothing selects on them. They hold arbitrary, often larger, operational metadata: a change-cause for a rollout, a checksum to force a restart, ingress tuning, or config for a controller.",
  },
  {
    id: "pitfall",
    text: "The split matters. Labels are for identifying and grouping - keep them short and queryable. Annotations are for tools and humans - build info, contact owner, last-applied config, or feature flags read by an operator. Many controllers are configured entirely through annotations.",
  },
  {
    id: "check",
    text: "What beginners get wrong: stuffing big values into labels, which have strict length limits, instead of annotations. Or expecting a Service to select Pods by an annotation - it cannot. Check kubectl describe for both sections; kubectl annotate updates one without touching labels.",
  },
  {
    id: "rule",
    text: "Rule to remember: label to select, annotate to describe.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
