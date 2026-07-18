import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/045-runes-vs-bytes.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 70.2;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "len",
  "bytes",
  "runes",
  "Unicode",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Why does len on a Cyrillic string give the wrong answer?",
  },
  {
    id: "bytes",
    text: "Because len counts bytes, not Unicode characters. The Cyrillic letter ye in UTF-8 is often two bytes long. Len of a one-character word can return two. Slice at byte index one and you cut through the middle of the character - users see broken symbols instead of text.",
  },
  {
    id: "types",
    text: "Use range when you need characters. A for loop over name with for character in name yields runes, each a thirty-two-bit code point. byte is one raw octet inside the encoding. rune is one logical character humans read. Count runes with utf8.RuneCountInString when you need a total without looping yourself.",
  },
  {
    id: "breaks",
    text: "Get this wrong and password limits, SMS segment counts, and max-length form checks lie to users. Fifty runes and fifty bytes describe very different strings. Your validation passes in tests with ASCII and fails in production with real names.",
  },
  {
    id: "rule",
    text: "Unicode rule - len for bytes, range for runes, and the utf8 package when you need encoding control.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
