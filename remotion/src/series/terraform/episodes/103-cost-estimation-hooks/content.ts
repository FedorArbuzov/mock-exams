import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Cost estimation";

export const AUDIO_SRC = "audio/terraform/103-cost-estimation-hooks.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 73.80;

export const HIGHLIGHT_WORDS = [
  "cost",
  "estimate",
  "budget",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "COST",
  chips: [
    "plan",
    "estimate",
    "budget",
  ],
  lines: [
    "plan -> cost delta",
    "review large increase",
  ],
  bad: "Cost found in bill",
  good: "Cost discussed in PR",
  stamp: "SHORT RULE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "The cheapest infrastructure change is the one reviewed before it ships." },
  { id: "explain", text: "Cost estimation hooks calculate or approximate the cost impact of a Terraform plan during review. They help teams notice large instances, new databases, data transfer patterns, and resource count growth before apply. Cost output belongs beside the plan, where owners can make an informed tradeoff." },
  { id: "detail", text: "Use estimates as directional signals, not invoices. Tag resources for allocation, compare proposed cost with budgets, and require explanation for meaningful increases. Connect the check to pull requests so it is visible early. Track actual cloud spend afterward to improve assumptions and catch usage-driven costs." },
  { id: "pitfall", text: "Ignoring estimates because they are imperfect misses their main value: prompting a conversation before commitment. Treating estimates as exact can also mislead, especially for usage-based services. Show confidence limits and pair them with architecture review for expensive changes." },
  { id: "rule", text: "Surface estimated cost changes during plan review, then verify actual spend." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
