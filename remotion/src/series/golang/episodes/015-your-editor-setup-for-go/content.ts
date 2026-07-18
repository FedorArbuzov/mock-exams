import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/015-your-editor-setup-for-go.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 44.0;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "gopls",
  "VS Code",
  "GoLand",
  "go.mod",
  "gofmt",
  "go test",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "VS Code or GoLand?",
  },
  {
    id: "editors",
    text: "Either works. What matters is gopls — the Go language server — giving you jump-to-definition, rename, and live errors. VS Code with the Go extension is free and common. GoLand is polished if your company pays.",
  },
  {
    id: "quickdecision",
    text: "Do not waste a week comparing editors. Pick one, install the Go plugin, open a folder with go.mod, and confirm autocomplete works on fmt.Println.",
  },
  {
    id: "formatonsave",
    text: "Also enable format on save with gofmt. Future you will thank you in code review.",
  },
  {
    id: "setupdone",
    text: "Setup done when: errors show inline, go test runs from the editor, and fmt on save works.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
