import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "any / interface{}";

export const AUDIO_SRC = "audio/golang/053-any-alias-for-interface.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 68.35;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "any",
  "interface",
  "type switch",
  "assert",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Is any just an escape hatch when typing gets hard?",
  },
  {
    id: "bridge",
    text: "Yes. any is an alias for interface with empty braces — a box that holds any concrete type. Use it at boundaries like JSON decode or generic containers, then narrow the type as soon as you know what is inside. It buys flexibility at the edge of your system, not in the core.",
  },
  {
    id: "narrow",
    text: "Restore type safety with a type switch or type assertion. Staying in any too long removes compile-time safety and pushes bugs to runtime. Go idioms push you back to concrete types or small interfaces quickly — treat any as a temporary holding area, not a design destination.",
  },
  {
    id: "design",
    text: "any is not a license to skip design. It is a bridge until you know the type — not a permanent home for business logic. Lean on interfaces and generics before you reach for any everywhere. If every function takes any, you have rebuilt dynamic typing without the safety net.",
  },
  {
    id: "pattern",
    text: "Pattern: decode to any, assert to struct or slice, run business logic on concrete types.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
