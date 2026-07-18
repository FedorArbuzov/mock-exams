import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/024-mini-checklist-first-go-hour.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 45.0;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "gopls",
  "module",
  "package main",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Your first hour with Go should hit a few concrete milestones. What should I have working tonight?",
  },
  {
    id: "fourthings",
    text: "Four things: go version prints a stable release, your editor shows gopls diagnostics, a hello program runs, and go fmt plus go vet are habits you actually ran once.",
  },
  {
    id: "coreloop",
    text: "Create a folder, initialize a module, write package main, run it. That proves toolchain, modules, and editor agree.",
  },
  {
    id: "dontoverdo",
    text: "Do not install five linters on hour one. Nail the core loop first: edit, format, vet, test, run.",
  },
  {
    id: "checklist",
    text: "First-hour checklist: version OK, hello runs, format on save, vet clean.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
