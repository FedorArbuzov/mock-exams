import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/031-one-package-per-folder-rule.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 45.0;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "package",
  "folder",
  "directory",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Go groups source files into packages by folder, not by declaration. Can two packages share a directory?",
  },
  {
    id: "rule",
    text: "No — every directory holds exactly one package, aside from separate test files. You cannot mix two different package names in the same folder.",
  },
  {
    id: "fix",
    text: "If you need two packages, make two folders. This sounds strict, but it keeps builds predictable.",
  },
  {
    id: "namematch",
    text: "The package name usually matches the directory name, but it does not have to — matching names still saves confusion.",
  },
  {
    id: "gotcha",
    text: "Gotcha: files in the same folder with different package declarations fail to compile. Split directories instead.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
