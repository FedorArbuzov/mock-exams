import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/044-strings-are-immutable-byte-sequences.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 66.91;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "immutable",
  "Builder",
  "string",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Can I change the first byte of a string to capital A?",
  },
  {
    id: "immutable",
    text: "No. Strings in Go are immutable byte sequences. Writing to index zero of name does not compile. The runtime treats every string as read-only data you can share safely across goroutines.",
  },
  {
    id: "share",
    text: "To edit text, convert to a rune slice, change the runes, then convert back with string of runes. That is the right path when you need to uppercase one letter in a name. For building a new string in a loop - like joining CSV rows - use strings.Builder. Each WriteString appends without copying the whole string every time.",
  },
  {
    id: "builder",
    text: "The failure mode is concatenation with plus-equals inside a loop. That allocates a fresh string on every iteration and can turn linear work into quadratic slowdown. Immutability makes sharing safe but surprises people coming from mutable string languages.",
  },
  {
    id: "remember",
    text: "Remember this - a string is read-only bytes. Build changes with Builder, not plus-equals in a loop.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
