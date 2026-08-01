import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "dependencies";

export const AUDIO_SRC = "audio/terraform/060-depends-on-vs-implicit-dependencies.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 71.54;

export const HIGHLIGHT_WORDS = [
  "depends_on",
  "graph",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "GRAPH",
  chips: [
    "reference",
    "order",
    "rare",
  ],
  lines: [
    "subnet_id = aws_subnet.app.id",
  ],
  bad: "Depends everywhere",
  good: "Reference first",
  stamp: "SHOW THE WHY",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Terraform already sees many dependencies from references." },
  { id: "explain", text: "Terraform builds a dependency graph from expressions that reference another resource's attributes. This implicit dependency is usually the clearest and safest approach. depends_on adds an explicit ordering edge when a real dependency exists but no value reference expresses it." },
  { id: "detail", text: "Prefer direct references, such as a subnet ID from a subnet resource, because they show why ordering exists. Use depends_on sparingly for side effects, policy attachments, or module-level relationships that Terraform cannot infer. Comment unusual explicit dependencies with the reason." },
  { id: "pitfall", text: "Adding depends_on everywhere makes plans less parallel and hides the actual data relationship. It cannot solve provider bugs or eventual consistency on its own. An unnecessary dependency may also force replacement decisions to spread through otherwise independent resources." },
  { id: "rule", text: "Let references build dependencies; add depends_on only for invisible relationships." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
