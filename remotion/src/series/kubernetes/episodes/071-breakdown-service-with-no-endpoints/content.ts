import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "Service no endpoints";

export const AUDIO_SRC = "audio/kubernetes/071-breakdown-service-with-no-endpoints.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 84.46;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "endpoints",
  "selector",
  "labels",
  "readiness",
  "namespace",
  "get endpoints",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Your Service exists but its endpoints are empty - why?",
  },
  {
    id: "define",
    text: "An empty endpoints list means the Service matched zero ready Pods, so traffic has nowhere to go. Three causes cover almost every case: selector mismatch, Pods not Ready, or the wrong namespace.",
  },
  {
    id: "failure",
    text: "First, the Service's selector labels must exactly match the Pod's labels - one typo and it finds nothing. Second, matching Pods only become endpoints when readiness passes. Third, a Service only selects Pods in its own namespace.",
  },
  {
    id: "check",
    text: "What beginners get wrong: debugging DNS or Ingress when the gap is here at the Service-to-Pod link. Flow: get endpoints your-svc - if empty, compare svc selector labels with pods show-labels, and check Ready plus namespace.",
  },
  {
    id: "rule",
    text: "Rule to remember: no endpoints means selector, readiness, or namespace - check those three first.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
