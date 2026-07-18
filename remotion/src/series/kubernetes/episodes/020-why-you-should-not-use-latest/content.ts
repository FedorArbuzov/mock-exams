import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "Avoid the latest tag";

export const AUDIO_SRC = "audio/kubernetes/020-why-you-should-not-use-latest.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 64.39;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "latest",
  "tag",
  "digest",
  "sha256",
  "rollback",
  "reproducible",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Why is the latest tag a trap in Kubernetes?",
  },
  {
    id: "define",
    text: "Because latest is not a version - it is just a label that moves. Two nodes can pull latest on different days and run different code, and you cannot tell what is live from the manifest. Rollbacks become guesswork when every release points at the same tag.",
  },
  {
    id: "failure",
    text: "What breaks: you push a new latest, but running Pods keep the old cached image, so nothing changes on deploy. Or a Pod reschedules, pulls a newer latest than its neighbors, and now your replicas are inconsistent. Debugging gets painful because kubectl describe shows latest everywhere.",
  },
  {
    id: "check",
    text: "Practical fix: pin an explicit tag like v1 dot 4 dot 2, or better, pin the image digest with the at sha256 form. That makes each deploy reproducible and each rollback exact. Let your CI stamp the tag from the commit.",
  },
  {
    id: "rule",
    text: "Rule to remember: latest hides the version - pin a tag or a digest.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
