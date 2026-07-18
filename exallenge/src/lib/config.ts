export const siteConfig = {
  name: "EXALLENGE",
  tagline: "Master DevOps through interactive learning.",
  description:
    "Interactive DevOps learning platform with visual lessons, hands-on labs, and interview questions.",
  url: "https://exallenge.com",
  founderPrice: process.env.NEXT_PUBLIC_FOUNDER_PRICE ?? "$149",
  founderCtaHref: "#founder",
  demoHref: "#learn-visually",
  stats: {
    students: "2,400+",
    lessons: "180+",
    labs: "90+",
    interviewQuestions: "250+",
    animatedVideos: "60+",
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
