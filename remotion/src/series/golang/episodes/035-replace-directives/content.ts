import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/035-replace-directives.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 45.0;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "replace",
  "go.mod",
  "local fork",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Go modules let you swap a dependency for a local checkout while you work. How do I test a local fork?",
  },
  {
    id: "mechanism",
    text: "Add a replace directive in your go.mod. It points your module's import path to a local folder instead of the cached remote version.",
  },
  {
    id: "temporary",
    text: "Replace is for local development and emergency patches — not a long-term publishing strategy. Comment why it's there, so it doesn't ship to production by accident.",
  },
  {
    id: "remove",
    text: "Remove the replace line before release, or make sure your CI uses the real module version.",
  },
  {
    id: "trick",
    text: "Dev trick: point replace at your own fork while you fix a bug upstream.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
