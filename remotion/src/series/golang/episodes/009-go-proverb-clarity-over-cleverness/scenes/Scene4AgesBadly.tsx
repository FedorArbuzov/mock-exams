import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {clamp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene4AgesBadly: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const crackProgress = progress01(frame, 20, durationInFrames * 0.6);
  const flicker = 1 - crackProgress * 0.7 + Math.sin(frame * 1.4) * crackProgress * 0.25;
  const tickCount = Math.floor(progress01(frame, 0, durationInFrames * 0.85) * 5);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 300,
          top: 700,
          transform: `translate(-50%, -50%) translateX(${crackProgress * Math.sin(frame * 2.7) * 3}px)`,
          opacity: Math.max(0.15, flicker),
        }}
      >
        <div
          style={{
            padding: "16px 22px",
            borderRadius: 12,
            border: `2px solid ${COLORS.muted}`,
            color: COLORS.muted,
            fontFamily: FONTS.mono,
            fontSize: 18,
          }}
        >
          {"x=f(g(h(y)))"}
        </div>
        <div style={{marginTop: 10, textAlign: "center", color: COLORS.muted, fontSize: 16}}>
          clever one-liner
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 800,
          top: 700,
          transform: "translate(-50%, -50%)",
        }}
      >
        <div
          style={{
            padding: "16px 22px",
            borderRadius: 12,
            border: `2px solid ${COLORS.cyan}`,
            color: COLORS.white,
            fontFamily: FONTS.mono,
            fontSize: 18,
            boxShadow: `0 0 20px ${COLORS.glowCyan}`,
          }}
        >
          {"return sum(items)"}
        </div>
        <div style={{marginTop: 10, textAlign: "center", color: COLORS.cyan, fontSize: 16}}>
          boring code
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 950,
          transform: "translateX(-50%)",
          display: "flex",
          gap: 14,
        }}
      >
        {Array.from({length: 5}).map((_, i) => (
          <div
            key={i}
            style={{
              width: 12,
              height: 12,
              borderRadius: 99,
              background: i < tickCount ? COLORS.cyan : COLORS.border,
              boxShadow: i < tickCount ? `0 0 8px ${COLORS.glowCyan}` : "none",
            }}
          />
        ))}
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
