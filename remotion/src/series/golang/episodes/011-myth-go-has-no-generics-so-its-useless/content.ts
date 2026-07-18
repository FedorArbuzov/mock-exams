import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/011-myth-go-has-no-generics-so-its-useless.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 46.9;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "Go",
  "generics",
  "1.18",
  "duplication",
  "interfaces",
  "interview",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Didn't Go refuse generics forever?",
  },
  {
    id: "unlocked",
    text: "Go added generics in 1.18, but the culture did not change: use them to remove real duplication, not to build a type framework. A generic Min function or a reusable container can be great. Generic everything is not.",
  },
  {
    id: "smallcodebase",
    text: "Many idiomatic Go still prefers simple functions and interfaces because they read cleaner in small codebases.",
  },
  {
    id: "interviewtrap",
    text: "Interview trap: saying Go has no generics dates you. Better answer: generics exist, but Go still favors simplicity first.",
  },
  {
    id: "rule",
    text: "Rule: reach for generics when copy-paste or interface{} hacks hurt — not when a plain function already works.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
