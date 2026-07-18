import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "kubectl explain";

export const AUDIO_SRC = "audio/kubernetes/051-kubectl-explain-docs-right-in-the-cli.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 69.7;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "kubectl explain",
  "OpenAPI",
  "spec",
  "schema",
  "recursive",
  "api-resources",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Forgot a spec field and do not want to open a browser?",
  },
  {
    id: "define",
    text: "kubectl explain. It prints the API schema and field descriptions straight from the cluster's OpenAPI. kubectl explain deployment shows top-level fields. Dot paths dig into the Pod template.",
  },
  {
    id: "pitfall",
    text: "This is faster than searching docs when you are mid-manifest. You learn which fields exist, which are required, and what they mean - matching the exact API version your cluster speaks, not a blog post for an older release.",
  },
  {
    id: "check",
    text: "What beginners get wrong: typing the wrong path and assuming the field does not exist. Or forgetting dash dash recursive for the full tree. Tip: keep explain open while writing YAML.",
  },
  {
    id: "rule",
    text: "Rule to remember: explain is cluster-local docs - trust it over random snippets.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
