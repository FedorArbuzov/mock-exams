import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/041-basic-types.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 72.14;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "int",
  "float",
  "string",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Which int should I pick in Go?",
  },
  {
    id: "sizes",
    text: "Start with the plain int type for counters, loop indexes, and everyday math. It maps to the native word size of the machine, so it is fast and simple. Reach for int64 when you store timestamps in nanoseconds, database IDs that cross systems, or anything that must survive JSON from JavaScript without overflow.",
  },
  {
    id: "boolstring",
    text: "Use uint only when the domain demands it - bitmask flags, binary protocols, or APIs that already expose unsigned integers. Do not pick uint just because a number is always positive. Float64 is for measurements and scientific math, never for money. Rounding errors turn zero point one plus zero point two into something close to but not exactly zero point three. Store cents as integers or use a decimal library instead.",
  },
  {
    id: "premature",
    text: "Booleans are just true or false - no truthy shortcuts. Strings hold UTF-8 bytes, not fixed-width characters, so never assume one byte equals one letter.",
  },
  {
    id: "habit",
    text: "Type habit - plain int by default, sized types only when the contract with the outside world demands it.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
