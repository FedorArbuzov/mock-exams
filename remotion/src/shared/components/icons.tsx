import React from "react";
import {COLORS} from "../constants";

type IconProps = {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
};

export const Flask: React.FC<IconProps> = ({size = 48, color = COLORS.muted, style}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={style}>
    <path d="M19 6h10M20 6v12l-9 20a3 3 0 0 0 3 4h20a3 3 0 0 0 3-4l-9-20V6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15 32h18" stroke={color} strokeWidth="2" opacity="0.6" />
    <circle cx="21" cy="37" r="1.6" fill={color} opacity="0.7" />
    <circle cx="27" cy="39" r="1.6" fill={color} opacity="0.7" />
  </svg>
);

export const NetworkNodes: React.FC<IconProps> = ({size = 48, color = COLORS.cyan, style}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={style}>
    <path d="M12 14L24 24L36 14M12 34L24 24L36 34" stroke={color} strokeWidth="2" opacity="0.8" />
    <circle cx="24" cy="24" r="4" fill={color} />
    <circle cx="12" cy="14" r="3" stroke={color} strokeWidth="2" fill={COLORS.background} />
    <circle cx="36" cy="14" r="3" stroke={color} strokeWidth="2" fill={COLORS.background} />
    <circle cx="12" cy="34" r="3" stroke={color} strokeWidth="2" fill={COLORS.background} />
    <circle cx="36" cy="34" r="3" stroke={color} strokeWidth="2" fill={COLORS.background} />
  </svg>
);

export const XMarkGlyph: React.FC<IconProps> = ({size = 48, color = COLORS.red, style}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" style={style}>
    <path d="M14 14l20 20M34 14l-20 20" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
  </svg>
);

export const ServerIcon: React.FC<IconProps> = ({size = 48, color = COLORS.cyan, style}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={style}>
    <rect x="8" y="8" width="32" height="10" rx="2.5" stroke={color} strokeWidth="2.5" />
    <rect x="8" y="22" width="32" height="10" rx="2.5" stroke={color} strokeWidth="2.5" />
    <rect x="8" y="36" width="32" height="4" rx="2" stroke={color} strokeWidth="2" opacity="0.5" />
    <circle cx="14" cy="13" r="1.8" fill={color} />
    <circle cx="14" cy="27" r="1.8" fill={color} />
  </svg>
);

export const ClockIcon: React.FC<IconProps> = ({size = 48, color = COLORS.muted, style}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={style}>
    <circle cx="24" cy="24" r="17" stroke={color} strokeWidth="2.5" />
    <path d="M24 15v9l7 4" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const MoonIcon: React.FC<IconProps> = ({size = 32, color = COLORS.muted, style}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={style}>
    <path
      d="M30 8a17 17 0 1 0 10 26A14 14 0 0 1 30 8z"
      fill={color}
      opacity="0.85"
    />
  </svg>
);

export const BellSlash: React.FC<IconProps> = ({size = 48, color = COLORS.red, style}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={style}>
    <path
      d="M14 30V21a10 10 0 0 1 16.5-7.6M34 30V21a10 10 0 0 0 -1-4.4"
      stroke={color}
      strokeWidth="2.3"
      strokeLinecap="round"
      opacity="0.8"
    />
    <path d="M12 30h24" stroke={color} strokeWidth="2.3" strokeLinecap="round" opacity="0.8" />
    <path d="M21 35a3 3 0 0 0 6 0" stroke={color} strokeWidth="2.3" strokeLinecap="round" opacity="0.8" />
    <path d="M9 9l30 30" stroke={color} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const ChatQuestion: React.FC<IconProps> = ({size = 48, color = COLORS.cyan, style}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={style}>
    <path
      d="M8 12a4 4 0 0 1 4-4h24a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H20l-8 7v-7h-0a4 4 0 0 1-4-4z"
      stroke={color}
      strokeWidth="2.3"
      strokeLinejoin="round"
    />
    <text x="24" y="26" textAnchor="middle" fontSize="16" fontWeight="700" fill={color}>
      ?
    </text>
  </svg>
);

export const ToolboxIcon: React.FC<IconProps> = ({size = 90, color = COLORS.muted, style}) => (
  <svg width={size} height={size} viewBox="0 0 90 70" fill="none" style={style}>
    <path d="M32 20v-4a6 6 0 0 1 6-6h14a6 6 0 0 1 6 6v4" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <rect x="10" y="20" width="70" height="38" rx="6" stroke={color} strokeWidth="3" />
    <path d="M10 38h70" stroke={color} strokeWidth="2.5" opacity="0.6" />
    <rect x="39" y="33" width="12" height="10" rx="2" fill={COLORS.background} stroke={color} strokeWidth="2.5" />
  </svg>
);

export const NotebookIcon: React.FC<IconProps> = ({size = 48, color = "#FBBF24", style}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={style}>
    <rect x="10" y="7" width="28" height="34" rx="3" stroke={color} strokeWidth="2.5" />
    <path d="M10 15h6M10 22h6M10 29h6" stroke={color} strokeWidth="2" opacity="0.7" />
    <path d="M20 15h12M20 22h12M20 29h8" stroke={color} strokeWidth="2" opacity="0.4" />
  </svg>
);

export const GaugeIcon: React.FC<IconProps & {needleAngle?: number}> = ({
  size = 48,
  color = COLORS.cyan,
  needleAngle = -30,
  style,
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={style}>
    <path d="M8 30a16 16 0 1 1 32 0" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <line
      x1="24"
      y1="30"
      x2={24 + Math.cos((needleAngle * Math.PI) / 180) * 13}
      y2={30 + Math.sin((needleAngle * Math.PI) / 180) * 13}
      stroke={color}
      strokeWidth="2.6"
      strokeLinecap="round"
    />
    <circle cx="24" cy="30" r="2.4" fill={color} />
  </svg>
);

export const RocketIcon: React.FC<IconProps> = ({size = 48, color = COLORS.cyan, style}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={style}>
    <path
      d="M24 6c6 4 9 11 9 18 0 4-1.5 8-3 10h-12c-1.5-2-3-6-3-10 0-7 3-14 9-18z"
      stroke={color}
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <circle cx="24" cy="18" r="3" fill={color} opacity="0.8" />
    <path d="M15 30l-5 8M33 30l5 8M20 34v8M28 34v8" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

export const MagnifyingGlass: React.FC<IconProps> = ({size = 48, color = COLORS.muted, style}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={style}>
    <circle cx="21" cy="21" r="13" stroke={color} strokeWidth="2.5" />
    <path d="M30.5 30.5L40 40" stroke={color} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const FolderIcon: React.FC<IconProps> = ({size = 48, color = COLORS.muted, style}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={style}>
    <path
      d="M6 14a3 3 0 0 1 3-3h9l4 4h17a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3z"
      stroke={color}
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
  </svg>
);

export const TargetIcon: React.FC<IconProps> = ({size = 48, color = COLORS.cyan, style}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={style}>
    <circle cx="24" cy="24" r="17" stroke={color} strokeWidth="2.2" />
    <circle cx="24" cy="24" r="10" stroke={color} strokeWidth="2.2" />
    <circle cx="24" cy="24" r="3.4" fill={color} />
  </svg>
);

export const GearIcon: React.FC<IconProps> = ({size = 48, color = COLORS.muted, style}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={style}>
    <circle cx="24" cy="24" r="8" stroke={color} strokeWidth="2.3" />
    <path
      d="M24 6v6M24 36v6M6 24h6M36 24h6M11 11l4.2 4.2M32.8 32.8L37 37M37 11l-4.2 4.2M15.2 32.8L11 37"
      stroke={color}
      strokeWidth="2.3"
      strokeLinecap="round"
    />
  </svg>
);

export const WindowIcon: React.FC<IconProps> = ({size = 48, color = COLORS.muted, style}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={style}>
    <rect x="6" y="9" width="36" height="30" rx="3" stroke={color} strokeWidth="2.3" />
    <path d="M6 17h36" stroke={color} strokeWidth="2" opacity="0.7" />
    <circle cx="11" cy="13" r="1.4" fill={color} />
    <circle cx="16" cy="13" r="1.4" fill={color} />
  </svg>
);

export const BrainIcon: React.FC<IconProps> = ({size = 48, color = COLORS.muted, style}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={style}>
    <path
      d="M19 8a6 6 0 0 0-6 6 5 5 0 0 0-3 9 5.5 5.5 0 0 0 4 9.3 6 6 0 0 0 5 3.7z"
      stroke={color}
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M29 8a6 6 0 0 1 6 6 5 5 0 0 1 3 9 5.5 5.5 0 0 1-4 9.3 6 6 0 0 1-5 3.7z"
      stroke={color}
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="M19 8v28M29 8v28" stroke={color} strokeWidth="1.6" opacity="0.5" />
  </svg>
);

export const HammerIcon: React.FC<IconProps> = ({size = 48, color = COLORS.muted, style}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={style}>
    <rect
      x="24.5"
      y="6"
      width="12"
      height="16"
      rx="2"
      transform="rotate(45 24.5 6)"
      stroke={color}
      strokeWidth="2.3"
    />
    <path d="M22 24L10 36a3 3 0 0 0 4 4l12-12" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ScaleIcon: React.FC<IconProps> = ({size = 48, color = COLORS.cyan, style}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={style}>
    <path d="M24 6v34M14 40h20" stroke={color} strokeWidth="2.3" strokeLinecap="round" />
    <path d="M8 12h14M26 12h14" stroke={color} strokeWidth="2.3" strokeLinecap="round" />
    <path d="M8 12l-4 9a4.5 4.5 0 0 0 8 0z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    <path d="M40 12l-4 9a4.5 4.5 0 0 0 8 0z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

export const LockIcon: React.FC<IconProps> = ({size = 48, color = COLORS.muted, style}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={style}>
    <rect x="10" y="21" width="28" height="19" rx="3" stroke={color} strokeWidth="2.3" />
    <path d="M16 21v-5a8 8 0 0 1 16 0v5" stroke={color} strokeWidth="2.3" />
    <circle cx="24" cy="30" r="2.6" fill={color} />
  </svg>
);

export const JoystickIcon: React.FC<IconProps> = ({size = 48, color = COLORS.muted, style}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={style}>
    <rect x="6" y="22" width="36" height="16" rx="8" stroke={color} strokeWidth="2.3" />
    <circle cx="16" cy="30" r="3.5" stroke={color} strokeWidth="2" />
    <circle cx="33" cy="27" r="2.2" fill={color} />
    <circle cx="38" cy="32" r="2.2" fill={color} />
  </svg>
);

export const GenericBracketIcon: React.FC<IconProps> = ({size = 48, color = COLORS.cyan, style}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={style}>
    <path d="M16 8L6 24l10 16" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M32 8l10 16-10 16" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <text x="24" y="29" textAnchor="middle" fontSize="14" fontWeight="700" fill={color}>
      T
    </text>
  </svg>
);

export const DownloadIcon: React.FC<IconProps> = ({size = 48, color = COLORS.cyan, style}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={style}>
    <path d="M24 6v24M24 30l9-9M24 30l-9-9" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 36v4a3 3 0 0 0 3 3h26a3 3 0 0 0 3-3v-4" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);

export const BriefcaseIcon: React.FC<IconProps> = ({size = 48, color = COLORS.muted, style}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={style}>
    <path d="M18 14v-3a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v3" stroke={color} strokeWidth="2.3" strokeLinecap="round" />
    <rect x="6" y="14" width="36" height="24" rx="3" stroke={color} strokeWidth="2.3" />
    <path d="M6 24h36" stroke={color} strokeWidth="2" opacity="0.6" />
    <rect x="21" y="21" width="6" height="6" rx="1.2" fill={color} opacity="0.8" />
  </svg>
);
