import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/030-cmd-and-internal-layout.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 45.0;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "cmd",
  "internal",
  "go.mod",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Go projects converge on one standard folder layout. How should I structure a real repo?",
  },
  {
    id: "cmdfolder",
    text: "Put executables under a cmd folder — one small main package per binary, like an API server, a worker, or a migration tool. Put private shared code under an internal folder. Put only deliberate public libraries at the repo root, or under a pkg folder if your team uses that convention.",
  },
  {
    id: "scales",
    text: "This layout scales. New hires know where mains live and what is safe to import from outside.",
  },
  {
    id: "avoid",
    text: "Avoid dumping everything in package main at the root — it becomes untestable soup.",
  },
  {
    id: "shape",
    text: "Standard shape: cmd for binaries, internal for private libs, go.mod at root.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
