import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/040-zero-values-everywhere.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 77.4;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "zero value",
  "nil",
  "guarantee",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "What is actually inside an uninitialized variable in Go?",
  },
  {
    id: "guarantee",
    text: "The zero value. Every type has one. Integers start at zero, booleans are false, strings are empty, and pointers, slices, maps, channels, interfaces, and function values are nil. Go never leaves random garbage in memory - your variables always start in a predictable state.",
  },
  {
    id: "safe",
    text: "That design removes a whole class of bugs. Declare a bytes.Buffer or a strings.Builder and it is immediately usable. An empty slice with value nil can still be passed to json.Marshal without panicking. You do not have to initialize everything before the first use.",
  },
  {
    id: "designwith",
    text: "But zero does not always mean ready. A nil map cannot accept writes - the first insert panics. A nil slice is fine for reading length zero, but appending works only because append handles nil safely. A mutex zero value is unlocked and ready; a connection struct at zero is not connected and needs explicit setup.",
  },
  {
    id: "review",
    text: "Before you ship a type, ask one question - does the zero value mean ready or broken? Handle the broken cases with a constructor or explicit init.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
