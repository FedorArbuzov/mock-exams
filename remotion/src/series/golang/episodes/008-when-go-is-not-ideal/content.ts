import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/008-when-go-is-not-ideal.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 49.0;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "Go",
  "Rust",
  "Java",
  "ML",
  "game engines",
  "compile-time safety",
  "concurrency",
  "tradeoff",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Should everything be rewritten in Go?",
  },
  {
    id: "badfits1",
    text: "No. Go is a bad default for a ten-line automation script — bash or Python is faster to write. It is a poor fit for complex desktop UIs. If your team already ships fine in Rust or Java with deep expertise, a rewrite buys little.",
  },
  {
    id: "badfits2",
    text: "Also skip Go when the problem is dominated by libraries Go lacks — some ML, game engines, or niche scientific stacks.",
  },
  {
    id: "tradeoff",
    text: "Choosing Go is an engineering tradeoff, not a moral victory. Use it where compile-time safety, simple deploys, and concurrency matter.",
  },
  {
    id: "sanitycheck",
    text: "Sanity check: if the team, libraries, and delivery model do not benefit, do not rewrite for fashion.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
