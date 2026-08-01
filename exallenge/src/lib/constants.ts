export const COLORS = {
  background: "#0B1020",
  backgroundElevated: "#111827",
  primary: "#4F9CF9",
  secondary: "#63E6FF",
  success: "#22C55E",
  danger: "#F87171",
  white: "#F8FAFC",
  muted: "#94A3B8",
  border: "rgba(148, 163, 184, 0.18)",
  card: "rgba(17, 24, 39, 0.72)",
  glowPrimary: "rgba(79, 156, 249, 0.35)",
  glowSecondary: "rgba(99, 230, 255, 0.28)",
  glowSuccess: "rgba(34, 197, 94, 0.28)",
} as const;

export const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Labs", href: "#labs" },
  { label: "Free Beta", href: "#founder" },
] as const;

export const ROADMAP_ITEMS = [
  { id: "linux", label: "Linux", status: "completed" as const },
  { id: "docker", label: "Docker", status: "completed" as const },
  { id: "networking", label: "Networking", status: "completed" as const },
  { id: "kubernetes", label: "Kubernetes", status: "current" as const },
  { id: "helm", label: "Helm", status: "upcoming" as const },
  { id: "terraform", label: "Terraform", status: "upcoming" as const },
  { id: "aws", label: "AWS", status: "upcoming" as const },
  { id: "cicd", label: "CI/CD", status: "upcoming" as const },
  { id: "monitoring", label: "Monitoring", status: "upcoming" as const },
  { id: "production", label: "Production", status: "upcoming" as const },
];

export const INTERVIEW_QUESTIONS = [
  "What is a Pod?",
  "What is ReplicaSet?",
  "Rolling Update vs Recreate?",
  "How kube-proxy works?",
  "What happens if a Pod crashes?",
  "Difference between Deployment and StatefulSet?",
];

export const FEATURES = [
  {
    title: "Structured Theory",
    description:
      "Clear explanations that build from fundamentals to production topics.",
    icon: "book" as const,
  },
  {
    title: "Hands-on Labs",
    description: "Practice DevOps using real scenarios.",
    icon: "terminal" as const,
  },
  {
    title: "Interview Questions",
    description: "Prepare for DevOps interviews with realistic questions.",
    icon: "interview" as const,
  },
  {
    title: "Learning Roadmaps",
    description: "Know exactly what to learn next.",
    icon: "roadmap" as const,
  },
  {
    title: "Progress Tracking",
    description: "Keep track of every completed lesson.",
    icon: "progress" as const,
  },
];

export const FAQ_ITEMS = [
  {
    question: "How much does it cost now?",
    answer:
      "The current launch is free for early users. Leave your email and we'll send access instructions.",
  },
  {
    question: "Who is this for?",
    answer: "Developers, students and DevOps engineers.",
  },
  {
    question: "Do I need DevOps experience?",
    answer: "No. You can start from the fundamentals and build up.",
  },
];
