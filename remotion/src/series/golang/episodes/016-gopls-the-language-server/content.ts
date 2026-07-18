import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/016-gopls-the-language-server.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 47.0;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "gopls",
  "go mod tidy",
  "diagnostics",
  "completions",
  "renames",
  "go build",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Why is my editor suddenly smart?",
  },
  {
    id: "whatisit",
    text: "That is gopls — the official Go language server. It parses your module, tracks types, and feeds your editor diagnostics, completions, and renames.",
  },
  {
    id: "whenbroken",
    text: "When gopls is broken, you get red squiggles on valid code or missing imports. Fixes: open the module root folder, not a single file; run go mod tidy; update gopls with go install golang.org/x/tools/gopls@latest.",
  },
  {
    id: "versionalign",
    text: "Keep gopls version roughly aligned with your Go toolchain. Mismatches cause weird false errors.",
  },
  {
    id: "debughabit",
    text: "Debug habit: if the editor disagrees with go build, trust go build and fix gopls workspace first.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
