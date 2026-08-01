import React from "react";
import {COLORS, FONTS} from "../../../shared/constants";

type TfFileProps = {
  size?: number;
  filename?: string;
  lines?: string[];
};

const DEFAULT_LINES = ['resource "aws_s3_bucket" "app" {', "  bucket = app-data", "}"];

/** Simple .tf document icon for Terraform shorts. */
export const TfFile: React.FC<TfFileProps> = ({
  size = 280,
  filename = "main.tf",
  lines = DEFAULT_LINES,
}) => {
  const scale = size / 280;

  return (
    <div
      style={{
        width: size,
        borderRadius: 18 * scale,
        border: `1.5px solid ${COLORS.cyan}88`,
        background: "rgba(7, 12, 24, 0.95)",
        boxShadow: `0 0 36px ${COLORS.glowCyan}`,
        overflow: "hidden",
        fontFamily: FONTS.mono,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 8 * scale,
          padding: `${12 * scale}px ${16 * scale}px`,
          borderBottom: `1px solid ${COLORS.border}`,
          background: "rgba(15, 23, 42, 0.9)",
          alignItems: "center",
        }}
      >
        {["#F87171", "#FBBF24", "#34D399"].map((c) => (
          <div
            key={c}
            style={{
              width: 10 * scale,
              height: 10 * scale,
              borderRadius: 99,
              background: c,
            }}
          />
        ))}
        <div
          style={{
            marginLeft: 10 * scale,
            color: COLORS.cyan,
            fontSize: 18 * scale,
            fontWeight: 700,
          }}
        >
          {filename}
        </div>
      </div>
      <pre
        style={{
          margin: 0,
          padding: `${20 * scale}px ${22 * scale}px`,
          color: COLORS.white,
          fontSize: 22 * scale,
          lineHeight: 1.55,
          minHeight: 120 * scale,
          whiteSpace: "pre-wrap",
        }}
      >
        {lines.join("\n")}
      </pre>
    </div>
  );
};
