import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/042-type-conversion-is-explicit.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 62.18;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "explicit",
  "conversion",
  "compiler",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Why will Go not cast types silently for me?",
  },
  {
    id: "explicit",
    text: "Because silent conversions hide bugs until production. In other languages you might add an integer and a float without a second thought. In Go you write int64 of count explicitly, so the compiler forces you to see the conversion.",
  },
  {
    id: "prevents",
    text: "That stops painful surprises. Casting a large thirty-two-bit integer down to eight bits truncates the high bits - you store three hundred and read back forty-four. Mixing signed and unsigned types without a cast is a compile error, not a quiet wrap at runtime. Converting float64 to int drops the decimal part - three point nine nine becomes three, not four.",
  },
  {
    id: "verbose",
    text: "It feels verbose on day one. It feels like armor on day three hundred.",
  },
  {
    id: "rule",
    text: "The rule is simple - if the types differ, convert explicitly. When the reason is not obvious, add a one-line comment so the next reader knows you meant that truncation.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
