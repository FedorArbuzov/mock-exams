import React from "react";
import {COLORS, FONTS} from "../../../shared/constants";

type YamlEditorProps = {
  typedChars: number;
  lines?: string[];
};

const DEFAULT_LINES = ["apiVersion: apps/v1", "kind: Deployment", "replicas: 3"];

export const YamlEditor: React.FC<YamlEditorProps> = ({
  typedChars,
  lines = DEFAULT_LINES,
}) => {
  const full = lines.join("\n");
  const visible = full.slice(0, typedChars);
  const showCaret = typedChars < full.length;

  return (
    <div
      style={{
        width: 820,
        borderRadius: 22,
        border: `1.5px solid ${COLORS.border}`,
        background: "rgba(7, 12, 24, 0.95)",
        boxShadow: `0 0 36px ${COLORS.glowBlue}`,
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
        <div style={{marginLeft: 12, color: COLORS.muted, fontSize: 18}}>deployment.yaml</div>
      </div>
      <pre
        style={{
          margin: 0,
          padding: "28px 30px",
          color: COLORS.white,
          fontSize: 34,
          lineHeight: 1.55,
          minHeight: 220,
          whiteSpace: "pre-wrap",
        }}
      >
        {visible}
        {showCaret ? (
          <span style={{color: COLORS.cyan, opacity: 0.9}}>|</span>
        ) : null}
      </pre>
    </div>
  );
};
