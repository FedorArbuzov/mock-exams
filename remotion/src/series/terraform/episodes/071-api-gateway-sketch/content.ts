import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "API Gateway";

export const AUDIO_SRC = "audio/terraform/071-api-gateway-sketch.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 72.67;

export const HIGHLIGHT_WORDS = [
  "API Gateway",
  "routes",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "API",
  chips: [
    "route",
    "Lambda",
    "logs",
  ],
  lines: [
    "client -> API -> integration",
  ],
  bad: "Missing permission",
  good: "End-to-end route",
  stamp: "TEST REQUESTS",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "An API gateway connects requests, routes, and integrations." },
  { id: "explain", text: "API Gateway exposes HTTP endpoints and routes requests to integrations such as Lambda, load balancers, or other services. Terraform can define APIs, routes, stages, integrations, permissions, logging, and custom domains. Start with the request path and authentication flow." },
  { id: "detail", text: "For a basic Lambda API, model the API, route, integration, deployment or stage, and permission allowing invocation. Enable access logs and define CORS intentionally for browser clients. Use environment-specific domain and stage strategy rather than assuming one endpoint fits every audience." },
  { id: "pitfall", text: "Creating the API and Lambda is not enough if Lambda permission does not authorize API Gateway invocation. CORS misconfiguration can look like an application outage. API deployments and stage changes have provider-specific lifecycle details, so verify real requests after apply." },
  { id: "rule", text: "Model routes, integration permission, logging, and client access together." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
