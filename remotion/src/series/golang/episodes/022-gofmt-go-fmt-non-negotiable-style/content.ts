import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/022-gofmt-go-fmt-non-negotiable-style.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 45.0;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "gofmt",
  "go fmt",
  "diffs",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Go has one official formatter for every file. Who decides tabs and braces?",
  },
  {
    id: "decision",
    text: "gofmt does. Not you, not your reviewer, not a style debate in Slack. Run go fmt and commit the result.",
  },
  {
    id: "savings",
    text: "That single decision saves thousands of hours across the ecosystem. Diffs show logic changes, not brace wars.",
  },
  {
    id: "editorintegration",
    text: "go fmt is also gofmt under the hood. Many editors run it on save — turn that on day one.",
  },
  {
    id: "rule",
    text: "Team rule: never hand-format Go. If fmt changes your file, the file was wrong before.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
