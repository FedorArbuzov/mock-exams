import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "DynamoDB";

export const AUDIO_SRC = "audio/terraform/069-dynamodb-table-basics.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 68.66;

export const HIGHLIGHT_WORDS = [
  "DynamoDB",
  "keys",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "TABLE",
  chips: [
    "key",
    "index",
    "recovery",
  ],
  lines: [
    "PK + optional SK",
  ],
  bad: "Columns first",
  good: "Queries first",
  stamp: "MODEL ACCESS",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "DynamoDB design starts with access patterns, not columns." },
  { id: "explain", text: "A DynamoDB table stores items using a primary key, commonly a partition key and optional sort key. Terraform can configure billing mode, attributes used by keys and indexes, encryption, streams, backups, and tags. Model queries before choosing the key design." },
  { id: "detail", text: "Use on-demand billing for variable or unknown workloads, or provisioned capacity when you can manage predictable throughput. Define only attributes required by keys and indexes. Enable point-in-time recovery where data recovery matters, and plan indexes around actual query patterns." },
  { id: "pitfall", text: "DynamoDB is not a relational table with arbitrary query flexibility. Adding indexes later can cost time and money, while changing primary keys usually requires migration. Treat table deletion and replacement carefully because state changes can imply data loss." },
  { id: "rule", text: "Choose DynamoDB keys from query patterns and protect important data." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
