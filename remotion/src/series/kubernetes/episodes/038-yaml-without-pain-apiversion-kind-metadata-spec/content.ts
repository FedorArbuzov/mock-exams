import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "YAML basics";

export const AUDIO_SRC = "audio/kubernetes/038-yaml-without-pain-apiversion-kind-metadata-spec.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 81.36;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "apiVersion",
  "kind",
  "metadata",
  "spec",
  "indentation",
  "spaces",
  "dry-run",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Why can one bad indent break your whole deploy?",
  },
  {
    id: "define",
    text: "Because Kubernetes YAML is structure, not decoration. Almost every manifest has four blocks. apiVersion says which API group and version. kind says what object it is - Deployment, Service, ConfigMap. metadata carries the name, namespace, and labels. spec is the desired state you want the cluster to reach.",
  },
  {
    id: "pitfall",
    text: "YAML uses indentation to express nesting, and it must be spaces, never tabs. One misaligned line moves a field into the wrong parent, so containers ends up outside the template, or ports lands under the wrong key. The API then rejects it, or silently ignores the misplaced field.",
  },
  {
    id: "check",
    text: "What beginners get wrong: copying snippets with mixed tabs and spaces, or guessing which fields nest where. Also confusing kind casing - it is Deployment, not deployment. Use kubectl apply dash dash dry-run equals client to validate, and kubectl explain to see what nests where.",
  },
  {
    id: "rule",
    text: "Rule to remember: apiVersion, kind, metadata, spec - spaces only, structure is everything.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
