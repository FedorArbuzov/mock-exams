import { type SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function baseProps({ size = 24, className, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    className,
    "aria-hidden": true as const,
    ...props,
  };
}

export function IconBook(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16.5A1.5 1.5 0 0 1 18.5 21H6.5A2.5 2.5 0 0 0 4 23.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M4 5.5V20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M8 7h8M8 11h6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconVisual(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect
        x="3"
        y="4"
        width="18"
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8 18.5v1.5M16 18.5v1.5M7 11l3-2.5 3 3 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconTerminal(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M7 9l3 2.5L7 14M12 14h5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconInterview(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="M8 7h8M8 11h5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-5l-3.5 3v-3H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconRoadmap(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="6" cy="6" r="2.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="18" cy="12" r="2.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="6" cy="18" r="2.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 7.5 16 11M8 16.5l8-3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconProgress(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle
        cx="12"
        cy="12"
        r="8.25"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.35"
      />
      <path
        d="M12 3.75a8.25 8.25 0 0 1 8.25 8.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9 12.5l2 2 4-4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="M5 12.5l4.2 4.2L19 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconPlay(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 8.8v6.4l5.4-3.2L10 8.8Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconGithub(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        fill="currentColor"
        d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0 1 12 6.8c.85 0 1.71.11 2.51.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.86v2.76c0 .26.18.58.69.48A10 10 0 0 0 12 2Z"
      />
    </svg>
  );
}

export function IconTwitter(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        fill="currentColor"
        d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.59l-5.16-6.74L5.3 22H2.04l8.02-9.16L1.5 2h6.76l4.66 6.16L18.244 2Zm-1.16 18h1.82L7.03 3.94H5.08L17.084 20Z"
      />
    </svg>
  );
}

export function IconYoutube(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        fill="currentColor"
        d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C17.9 5 12 5 12 5s-5.9 0-7.7.3a2.7 2.7 0 0 0-1.9 1.9A28 28 0 0 0 2 12a28 28 0 0 0 .4 4.8 2.7 2.7 0 0 0 1.9 1.9C6.1 19 12 19 12 19s5.9 0 7.7-.3a2.7 2.7 0 0 0 1.9-1.9A28 28 0 0 0 22 12a28 28 0 0 0-.4-4.8ZM10 15.2V8.8L15.5 12 10 15.2Z"
      />
    </svg>
  );
}

export function IconLinux(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="M12 3c1.6 0 2.8 1.7 2.6 3.4-.1.9.2 1.6.7 2.2 1.2 1.4 2.2 3 2.2 4.9 0 2.7-1.8 5-4.5 5.8M12 3c-1.6 0-2.8 1.7-2.6 3.4.1.9-.2 1.6-.7 2.2C7.5 10 6.5 11.6 6.5 13.5c0 2.7 1.8 5 4.5 5.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="10" cy="10.5" r="0.8" fill="currentColor" />
      <circle cx="14" cy="10.5" r="0.8" fill="currentColor" />
      <path
        d="M10.2 13.2c.5.5 1.2.8 1.8.8s1.3-.3 1.8-.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export const featureIcons = {
  book: IconBook,
  visual: IconVisual,
  terminal: IconTerminal,
  interview: IconInterview,
  roadmap: IconRoadmap,
  progress: IconProgress,
} as const;
