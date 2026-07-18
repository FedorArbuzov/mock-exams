import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/021-comments-that-help-and-ones-that-dont.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 44.5;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "comments",
  "doc comments",
  "exported",
  "PR",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Should every line have a comment?",
  },
  {
    id: "philosophy",
    text: "No. Comment why something is true, not what the code obviously does. Bad: increment i. Good: retry budget exhausted, stop hammering upstream.",
  },
  {
    id: "docstyle",
    text: 'Exported functions and types need doc comments that start with the name — something like "ParseConfig reads the config file." That text becomes your generated documentation.',
  },
  {
    id: "honesty",
    text: "Comments that lie are worse than none. If behavior changes, update the comment in the same PR.",
  },
  {
    id: "rule",
    text: "Review rule: if a comment repeats the function name in English, delete it. If it explains a non-obvious invariant, keep it.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
