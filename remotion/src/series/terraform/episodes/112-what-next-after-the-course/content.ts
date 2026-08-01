import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Next steps";

export const AUDIO_SRC = "audio/terraform/112-what-next-after-the-course.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 74.78;

export const HIGHLIGHT_WORDS = [
  "practice",
  "CI",
  "operations",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "NEXT",
  chips: [
    "build",
    "review",
    "operate",
  ],
  lines: [
    "Project -> CI -> cloud",
    "Learn from real plans",
  ],
  bad: "Syntax-only learning",
  good: "Operate safe changes",
  stamp: "SHORT RULE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Terraform skill grows when you operate real changes, not just write HCL." },
  { id: "explain", text: "After the course, build a small production-like project with remote state, modules, CI plans, short-lived credentials, policy checks, and a documented recovery path. Practice reading plans and debugging errors. Then deepen one cloud area, such as networking, IAM, containers, or data platforms, through real scenarios." },
  { id: "detail", text: "Contribute improvements to an existing infrastructure repository or create a portfolio project with a clear README and architecture notes. Learn provider release management, import and migration workflows, testing approaches, and cost awareness. Keep practicing reviews: explaining why a change is safe is as valuable as writing it." },
  { id: "pitfall", text: "Collecting more Terraform syntax without operating infrastructure leaves important gaps in state, permissions, incidents, and team workflow. Do not jump straight to complex multi-cloud abstractions. Build reliable foundations, automate one workflow at a time, and learn from actual plans." },
  { id: "rule", text: "Practice safe end-to-end changes in a realistic shared workflow." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
