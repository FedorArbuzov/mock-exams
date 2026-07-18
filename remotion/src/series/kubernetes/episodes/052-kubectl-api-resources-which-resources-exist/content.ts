import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "api-resources";

export const AUDIO_SRC = "audio/kubernetes/052-kubectl-api-resources-which-resources-exist.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 76.9;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "api-resources",
  "short names",
  "CRD",
  "Kind",
  "namespaced",
  "api-versions",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "How do you know which object types this cluster supports?",
  },
  {
    id: "define",
    text: "kubectl api-resources. It lists every API resource the cluster exposes - names, short names, API groups, whether they are namespaced, and the Kind. That list is the menu of what you can get, describe, and apply.",
  },
  {
    id: "pitfall",
    text: "Why it matters: clusters differ. One has Ingress, another uses Gateway. Operators add CustomResourceDefinitions you will never see in a tutorial. api-resources shows the truth for this cluster, right now.",
  },
  {
    id: "check",
    text: "What beginners get wrong: memorizing names from a course and failing when a short name differs, or missing CRDs. Tip: filter namespaced resources, then kubectl get that name. Short names like deploy and svc come from this list.",
  },
  {
    id: "rule",
    text: "Rule to remember: api-resources is the cluster's menu - check it before you guess.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
