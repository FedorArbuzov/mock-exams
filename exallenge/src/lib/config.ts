export const siteConfig = {
  name: "EXALLENGE",
  tagline: "Free beta for early DevOps learners.",
  description:
    "A free DevOps beta with structured lessons, hands-on labs, and interview prep built with early users.",
  url: "https://exallenge.tech",
  founderPrice: process.env.NEXT_PUBLIC_FOUNDER_PRICE ?? "Free",
  founderCtaHref: "#founder",
  demoHref: "#labs",
  stats: {
    students: "Beta",
    lessons: "180+",
    labs: "90+",
    interviewQuestions: "250+",
  },
  social: {
    github: "https://github.com",
    youtube: "https://youtube.com",
    twitter: "https://twitter.com",
    docs: "#",
    privacy: "#",
    terms: "#",
  },
} as const;
