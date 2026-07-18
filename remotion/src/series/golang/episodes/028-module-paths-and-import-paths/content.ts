import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/028-module-paths-and-import-paths.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 45.0;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "module path",
  "import paths",
  "tags",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Go identifies every module by a global address. Why do imports look like URLs?",
  },
  {
    id: "uniqueness",
    text: "Because import paths must be globally unique. The convention is your module path mirrors your repo's web address.",
  },
  {
    id: "notfetchable",
    text: "That is not always a fetchable URL for private repos, but it is still the identity key. Go modules resolve versions from that path plus tags.",
  },
  {
    id: "renamewarning",
    text: "Rename your module path carefully — it is a public API for importers. A bad path is painful to fix later.",
  },
  {
    id: "rule",
    text: "Rule: module path equals where code is hosted, packages append path segments under it.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
