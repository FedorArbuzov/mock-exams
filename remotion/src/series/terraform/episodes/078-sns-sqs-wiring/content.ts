import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "SNS and SQS";

export const AUDIO_SRC = "audio/terraform/078-sns-sqs-wiring.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 67.73;

export const HIGHLIGHT_WORDS = [
  "SNS",
  "SQS",
  "queue policy",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "FLOW",
  chips: [
    "topic",
    "queue",
    "consumer",
  ],
  lines: [
    "SNS topic -> SQS queue",
    "Policy: SourceArn = topic",
  ],
  bad: "Subscription only",
  good: "Subscription plus policy",
  stamp: "SHORT RULE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "A queue is not connected until its policy says it is." },
  { id: "explain", text: "SNS publishes messages to many subscribers, while SQS stores messages for consumers to process later. Terraform can wire an SNS topic to an SQS queue and create the queue policy that permits that exact topic to send. The policy is the often missed part of the connection." },
  { id: "detail", text: "Use the topic ARN in the subscription and scope the SQS policy condition to that same ARN. Consider dead-letter queues, encryption, delivery retries, and visibility timeout as part of the design. Name each resource by its business event so people can trace a message path during incidents." },
  { id: "pitfall", text: "Creating a subscription without an SQS queue policy produces confusing delivery failures. A broad policy that permits any topic is worse, because it weakens isolation. Grant only the intended topic permission to send messages to the intended queue." },
  { id: "rule", text: "Wire subscriptions and least-privilege queue policies together." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
