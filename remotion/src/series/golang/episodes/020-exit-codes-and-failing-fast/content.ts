import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/020-exit-codes-and-failing-fast.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 44.0;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "exit code",
  "main",
  "stderr",
  "CI",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "How do CLIs signal failure?",
  },
  {
    id: "mechanism",
    text: "With an exit call, or by returning a non-zero status from main. Convention: zero means success, anything else means failure. Shell scripts and CI read that status code — not your printed output.",
  },
  {
    id: "ownership",
    text: "In Go, many errors return up to main, which exits with a failure code. Libraries should return errors; only main should trigger the exit.",
  },
  {
    id: "silentfail",
    text: "If your CLI always exits zero even when it fails, cron jobs and pipelines silently succeed. That is a production bug.",
  },
  {
    id: "rule",
    text: "CLI rule: on error, print to stderr, exit non-zero. Scripts depend on it.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
