import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/026-gomod-in-plain-words.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 45.0;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "go.mod",
  "go.sum",
  "module path",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Every Go module starts with one small file. What is this go.mod file?",
  },
  {
    id: "identity",
    text: "go.mod is your project's identity card. It declares the module path — how others import you — and lists dependency versions. go.sum stores checksums so builds are reproducible.",
  },
  {
    id: "withwithout",
    text: "Without go.mod you are outside the module system. With it, anyone can clone your repo and build it.",
  },
  {
    id: "pathmatch",
    text: "The module path should match where the code lives, usually your Git host path — your username and repo name.",
  },
  {
    id: "firststep",
    text: "First real project step after creating a folder: initialize the module with your import path, then write code and let imports drive dependencies.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
