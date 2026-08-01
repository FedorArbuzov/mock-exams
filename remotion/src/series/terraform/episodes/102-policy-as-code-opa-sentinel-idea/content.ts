import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Policy as code";

export const AUDIO_SRC = "audio/terraform/102-policy-as-code-opa-sentinel-idea.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 73.78;

export const HIGHLIGHT_WORDS = [
  "OPA",
  "Sentinel",
  "guardrails",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "POLICY",
  chips: [
    "plan",
    "rule",
    "allow",
  ],
  lines: [
    "plan -> policy check",
    "deny public bucket",
  ],
  bad: "Manual memory check",
  good: "Automated guardrail",
  stamp: "SHORT RULE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "A policy can reject a risky plan before cloud access makes it real." },
  { id: "explain", text: "Policy as code evaluates Terraform plans against organization rules before apply. Tools such as OPA or Sentinel can require encryption, approved regions, mandatory tags, or forbid public exposure. Policies make guardrails repeatable and reviewable instead of relying only on tribal knowledge and manual checks." },
  { id: "detail", text: "Start with a few high-value rules tied to real risk and provide clear failure messages with remediation steps. Test policies against allowed and denied plans. Version policy changes, assign owners, and allow documented exceptions where business needs legitimately differ. Run policy checks alongside plan generation in CI." },
  { id: "pitfall", text: "An enormous policy library with vague messages becomes a delivery bottleneck and encourages bypasses. Policies cannot replace good module defaults or human review. Keep rules measurable, explain why they exist, and monitor false positives before enforcing broadly." },
  { id: "rule", text: "Enforce clear, testable plan rules with useful remediation messages." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
