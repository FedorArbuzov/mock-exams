import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Module composition";

export const AUDIO_SRC = "audio/terraform/093-module-composition-patterns.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 70.56;

export const HIGHLIGHT_WORDS = [
  "composition",
  "outputs",
  "dependencies",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "LINK",
  chips: [
    "network",
    "service",
    "logs",
  ],
  lines: [
    "network.output -> service.input",
    "service.output -> monitor.input",
  ],
  bad: "Deep hidden nesting",
  good: "Explicit connections",
  stamp: "SHORT RULE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Modules should connect like small tools, not nest like Russian dolls." },
  { id: "explain", text: "Composition means a root or higher-level module combines focused child modules through their documented inputs and outputs. For example, a service module can receive a network ID and a logging destination created elsewhere. This preserves clear ownership while allowing complete deployments to be assembled." },
  { id: "detail", text: "Prefer shallow, understandable dependency graphs. Pass values explicitly rather than letting modules discover unrelated infrastructure by convention. Use composition layers when a repeatable application stack needs coordination, but keep foundational modules independently usable. Outputs should make connections visible in both code and plans." },
  { id: "pitfall", text: "Deep nesting makes it hard to know where a resource comes from and where a change should be made. A god composition module also becomes a hidden platform. Keep each module focused and let roots make environment-specific assembly decisions." },
  { id: "rule", text: "Compose focused modules through explicit, documented values." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
