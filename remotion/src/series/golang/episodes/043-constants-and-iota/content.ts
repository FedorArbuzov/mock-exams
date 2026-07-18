import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/043-constants-and-iota.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 67.73;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "enums",
  "iota",
  "constants",
  "Status",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "How do Go enums work without a dedicated enum keyword?",
  },
  {
    id: "iotablock",
    text: "With typed constants and iota. Declare type Status int, then in a const block write StatusPending equals iota, then StatusActive, then StatusDone. Each name gets the next integer - zero, one, two - without inheritance or a heavyweight class tree.",
  },
  {
    id: "typed",
    text: "iota resets to zero in every new const block. Need a gap? Put a blank identifier on its own line to skip a value. Outside that block, these names are Status values, not random integers sprinkled through your logic.",
  },
  {
    id: "idiomatic",
    text: "Wire them into a switch or a String method for display. Map StatusPending to the word pending in logs and JSON. Compare with status equals StatusActive instead of magic number two - the compiler catches typos and invalid states early. No runtime overhead, no reflection, just names the whole team can read.",
  },
  {
    id: "pattern",
    text: "Pattern to remember - typed Status, const block with iota, then String or switch for humans.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
