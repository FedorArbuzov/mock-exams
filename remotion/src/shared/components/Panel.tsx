import React from "react";
import {COLORS} from "../constants";

type PanelProps = {
  width?: number;
  height?: number;
  accent?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

/**
 * Large bordered content card used to anchor a scene's diagram so it reads as
 * full/substantial on the 1080x1920 canvas instead of a small element adrift
 * in empty space. Sizing intentionally large by default (see feedback memory
 * on composition density, 2026-07-14).
 */
export const Panel: React.FC<PanelProps> = ({
  width = 860,
  height = 860,
  accent = COLORS.cyan,
  style,
  children,
}) => (
  <div
    style={{
      position: "relative",
      width,
      height,
      borderRadius: 32,
      border: `1.5px solid ${accent}66`,
      background: "rgba(9, 14, 26, 0.55)",
      boxShadow: `0 0 44px ${accent}30, inset 0 0 60px rgba(9,14,26,0.4)`,
      ...style,
    }}
  >
    {children}
  </div>
);
