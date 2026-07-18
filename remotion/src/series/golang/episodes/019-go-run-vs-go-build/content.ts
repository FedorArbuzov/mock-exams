import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/019-go-run-vs-go-build.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 45.0;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "go run",
  "go build",
  "go install",
  "CI",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "When do I compile?",
  },
  {
    id: "whentouse",
    text: "Use go run for quick experiments — it compiles to a temporary binary and runs it immediately. Use go build or go install when you want an artifact you can ship or put on your path.",
  },
  {
    id: "production",
    text: "go run is perfect while learning. Production and CI should build a named binary so you know exactly what shipped.",
  },
  {
    id: "mistake",
    text: "Common mistake: debugging with go run but never verifying the built binary behaves the same. Build it before you tag a release.",
  },
  {
    id: "habit",
    text: "Habit: prototype with go run, commit only once a full build passes cleanly.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
