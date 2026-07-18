import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "Pointers";

export const AUDIO_SRC = "audio/golang/047-pointers-without-fear.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 65.45;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "pointer",
  "nil",
  "address",
  "dereference",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Do I need pointer arithmetic to write real Go code?",
  },
  {
    id: "basics",
    text: "No. Go pointers are simpler than C pointers. A pointer holds an address so you can mutate shared state or avoid copying a large struct on every function call. There is no pointer math — you cannot add one to a pointer and walk through memory like in C.",
  },
  {
    id: "nilpanic",
    text: "Use address-of to take a pointer from a variable, and star to read or write the value it points to. Dereferencing a nil pointer panics at runtime, so treat nil as optional and check before you star. That one check saves hours of debugging.",
  },
  {
    id: "simple",
    text: "Pointers are not scary — they are explicit sharing. Go removed the dangerous half of pointers and kept the useful half. You get mutation in place, efficient passing of big structs, and nil to signal not present without extra wrapper types.",
  },
  {
    id: "habit",
    text: "Safe habit: pointer receivers when a method mutates state, address-of when you need shared ownership, and nil checks before every dereference.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
