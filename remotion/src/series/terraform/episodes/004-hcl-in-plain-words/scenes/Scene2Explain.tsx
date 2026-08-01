import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const BLOCKS = ["terraform", "provider", "resource", "variable", "output"] as const;

export const Scene2Explain: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const titleIn = progress01(frame, 0, 18);

  return (
    <AbsoluteFill>
      <div style={{position: "absolute", left: "50%", top: 780, transform: "translate(-50%, -50%)"}}>
        <Panel width={920} height={720}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 120,
              transform: "translate(-50%, -50%)",
              opacity: titleIn,
              color: COLORS.muted,
              fontFamily: FONTS.sans,
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: 1.2,
              textTransform: "uppercase",
            }}
          >
            config blocks
          </div>
          {BLOCKS.map((block, i) => {
            const chipIn = progress01(frame, 14 + i * 10, 32 + i * 10);
            return (
              <div
                key={block}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: 220 + i * 88,
                  transform: `translate(-50%, -50%) translateY(${(1 - chipIn) * 18}px) scale(${0.92 + chipIn * 0.08})`,
                  opacity: chipIn,
                  padding: "18px 36px",
                  borderRadius: 14,
                  border: `1.5px solid ${COLORS.cyan}88`,
                  background: "rgba(15, 23, 42, 0.65)",
                  color: COLORS.cyan,
                  fontFamily: FONTS.mono,
                  fontSize: 42,
                  fontWeight: 780,
                  textShadow: `0 0 12px ${COLORS.glowCyan}`,
                  minWidth: 340,
                  textAlign: "center",
                }}
              >
                {block}
              </div>
            );
          })}
        </Panel>
      </div>
      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
