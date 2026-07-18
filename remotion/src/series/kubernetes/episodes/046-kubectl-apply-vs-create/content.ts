import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "apply vs create";

export const AUDIO_SRC = "audio/kubernetes/046-kubectl-apply-vs-create.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 73.97;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "apply",
  "create",
  "idempotent",
  "AlreadyExists",
  "last-applied",
  "three-way merge",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Why does kubectl create fail the second time you run it?",
  },
  {
    id: "define",
    text: "Because create is imperative and one-shot: it makes a new object, and if it already exists, it errors with AlreadyExists. apply is declarative and idempotent: it creates the object if missing, and updates it to match your manifest if it exists. Run apply a hundred times, same result.",
  },
  {
    id: "failure",
    text: "The deeper difference is updates. apply records your manifest as the last-applied configuration, so it can compute a three-way merge and change only what you changed. create has no such memory - it just refuses when the name is taken.",
  },
  {
    id: "check",
    text: "What beginners get wrong: scripting create in CI, which breaks on the second deploy. Or mixing create and apply on the same object, which confuses last-applied tracking. Tip: use apply for files; reserve create for throwaway objects or generating YAML.",
  },
  {
    id: "rule",
    text: "Rule to remember: create makes once, apply reconciles every time.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
