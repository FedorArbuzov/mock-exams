import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "Labels";

export const AUDIO_SRC = "audio/kubernetes/030-labels-basic-resource-organization.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 78.65;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "labels",
  "key/value",
  "selector",
  "app.kubernetes.io",
  "ReplicaSet",
  "controllers",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "What does grouping in Kubernetes actually rely on?",
  },
  {
    id: "define",
    text: "Labels. A label is a key/value tag you attach to objects - app equals api, env equals prod, tier equals backend. They are not just documentation. Controllers and Services use labels to find the Pods they manage, so labels are load-bearing infrastructure.",
  },
  {
    id: "pitfall",
    text: "You query them with label selectors. kubectl get pods dash l app equals api returns just those Pods. A Deployment's selector decides which Pods it owns. A Service's selector decides which Pods receive its traffic. Change a label and you can hand a Pod to a different owner.",
  },
  {
    id: "check",
    text: "What beginners get wrong: inconsistent labels across a team, so nothing lines up. Or editing a running Pod's labels and pulling it out from under its ReplicaSet, which then spins up a replacement. Adopt the standard app dot kubernetes dot io labels for consistency.",
  },
  {
    id: "rule",
    text: "Rule to remember: labels are not comments - Services and controllers select on them.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
