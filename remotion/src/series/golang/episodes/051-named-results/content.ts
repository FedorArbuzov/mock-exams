import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "Named Returns";

export const AUDIO_SRC = "audio/golang/051-named-results.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 63.7;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "named",
  "defer",
  "return",
  "naked",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Are named return values idiomatic Go?",
  },
  {
    id: "whenuse",
    text: "Sometimes. A signature like func parse returning n int and err error lets defer adjust n or log on exit. Named results document what a tiny function returns and pair well with defer cleanup at the function boundary — perfect for small parsers and resource wrappers.",
  },
  {
    id: "avoid",
    text: "But overuse makes functions harder to read. Readers must track mutable named returns across many branches and early returns. Avoid named returns in long functions packed with business logic where the names blur into noise instead of helping.",
  },
  {
    id: "naked",
    text: "A naked return with no values in a long function is a code smell. A bare return forces readers to hunt for the named variables instead of seeing the values right at the exit. Explicit return values read clearer in anything non-trivial — say what you return at the point you return it.",
  },
  {
    id: "guideline",
    text: "Guideline: named returns for small functions with defer; explicit returns everywhere else.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
