import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "Types Checklist";

export const AUDIO_SRC = "audio/golang/054-mini-checklist-types-without-pain.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 74.4;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "zero value",
  "conversion",
  "shadowing",
  "nil",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "What should I verify in Go code reviews before merge?",
  },
  {
    id: "zero",
    text: "Zero values: does a nil slice or nil map break this code path? Every type has a default — make sure your logic handles empty and nil before you assume data exists. Off-by-one and nil panics often start here, especially in handlers that run before data is fully loaded.",
  },
  {
    id: "convert",
    text: "Conversions: are sizes explicit where it matters? Go will not silently widen or narrow — int to int32 needs an explicit cast when precision or overflow matters, especially at API boundaries and database columns. A wrong assumption here shows up as subtle data corruption, not a compile error.",
  },
  {
    id: "shadow",
    text: "Shadowing: does short declaration accidentally hide err or a loop variable? Also check string handling — byte length versus rune count for Unicode — and pointer nil paths before you ship. These are silent until production traffic hits the edge case.",
  },
  {
    id: "checklist",
    text: "Types are where junior Go bugs cluster. A five-minute type review saves an on-call page. Review checklist: zero value safe, explicit conversions, no shadowed err, nil pointers handled.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
