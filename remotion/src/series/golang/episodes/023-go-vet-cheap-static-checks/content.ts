import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/023-go-vet-cheap-static-checks.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 45.0;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "go vet",
  "linter",
  "CI",
  "tests",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Go ships a built-in static checker beyond the compiler. What catches silly bugs before tests?",
  },
  {
    id: "whatitcatches",
    text: "go vet does. It finds mistakes like printf format verbs that do not match arguments, unreachable code, suspicious struct tags, and common concurrency footguns.",
  },
  {
    id: "notlinter",
    text: "Vet is not a full linter — it is a fast baseline. Run go vet locally and in CI before merge.",
  },
  {
    id: "pairing",
    text: "Pair vet with tests. Vet catches classes of bugs tests miss; tests catch logic vet cannot see.",
  },
  {
    id: "cimin",
    text: "CI minimum for Go: a format check, go vet, and go test.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
