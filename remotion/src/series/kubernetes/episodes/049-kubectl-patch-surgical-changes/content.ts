import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "kubectl patch";

export const AUDIO_SRC = "audio/kubernetes/049-kubectl-patch-surgical-changes.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 75.41;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "kubectl patch",
  "JSON",
  "strategic merge",
  "surgical",
  "automation",
  "Git",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Need to change one field without rewriting the whole YAML?",
  },
  {
    id: "define",
    text: "kubectl patch. It updates specific parts of a live object with a minimal JSON or strategic merge patch. You do not open an editor and you do not re-apply a full manifest - you send only the change.",
  },
  {
    id: "pitfall",
    text: "Classic uses: scale a Deployment, add an annotation, flip an image tag in a script, or toggle a feature flag field. In CI and automation, patch is cleaner than edit because it is non-interactive and easy to repeat.",
  },
  {
    id: "check",
    text: "What beginners get wrong: guessing the JSON path and silently patching the wrong field. Or mixing patch types. Also patching without Git, so the next apply fights your patch. Always kubectl get after to verify.",
  },
  {
    id: "rule",
    text: "Rule to remember: patch for surgical updates - still put lasting changes in Git.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
