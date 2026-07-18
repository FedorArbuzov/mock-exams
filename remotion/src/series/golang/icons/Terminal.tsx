import React from "react";
import {COLORS, FONTS} from "../../../shared/constants";

type TerminalProps = {
  typedChars: number;
  lines?: string[];
  title?: string;
  width?: number;
  accent?: string;
};

const DEFAULT_LINES = ["$ go build", "$ ./app"];

export const Terminal: React.FC<TerminalProps> = ({
  typedChars,
  lines = DEFAULT_LINES,
  title = "terminal",
  width = 820,
  accent,
}) => {
  const full = lines.join("\n");
  const visible = full.slice(0, typedChars);
  const showCaret = typedChars < full.length;

  return (
    <div
      style={{
        width,
        borderRadius: 22,
        border: `1.5px solid ${accent ? `${accent}88` : COLORS.border}`,
        background: "rgba(7, 12, 24, 0.95)",
        boxShadow: `0 0 36px ${accent ? `${accent}55` : COLORS.glowCyan}`,
        overflow: "hidden",
        fontFamily: FONTS.mono,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "14px 18px",
          borderBottom: `1px solid ${COLORS.border}`,
          background: "rgba(15,23,42,0.9)",
        }}
      >
        {["#F87171", "#FBBF24", "#34D399"].map((c) => (
          <div key={c} style={{width: 12, height: 12, borderRadius: 99, background: c}} />
        ))}
        <div style={{marginLeft: 12, color: COLORS.muted, fontSize: 18}}>{title}</div>
      </div>
      <pre
        style={{
          margin: 0,
          padding: "28px 30px",
          color: accent ?? COLORS.green,
          fontSize: 32,
          lineHeight: 1.55,
          minHeight: 160,
          whiteSpace: "pre-wrap",
        }}
      >
        {visible}
        {showCaret ? <span style={{color: COLORS.cyan, opacity: 0.9}}>|</span> : null}
      </pre>
    </div>
  );
};
