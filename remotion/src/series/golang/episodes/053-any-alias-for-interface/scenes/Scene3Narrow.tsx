import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {GitBranch} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const LINES = [
  "switch v := x.(type) {",
  "case string:",
  "case int:",
] as const;

export const Scene3Narrow: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const codeIn = progress01(frame, 0, 24);
  const iconIn = progress01(frame, 28, 48);
  const checkIn = progress01(frame, 52, 72);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 780,
          transform: "translate(-50%, -50%)",
        }}
      >
        <Panel width={960} height={720}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 260,
              transform: `translate(-50%, -50%) translateY(${(1 - codeIn) * 12}px)`,
              opacity: codeIn,
              padding: "20px 28px",
              borderRadius: 12,
              border: `1.5px solid ${COLORS.cyan}88`,
              background: "rgba(15, 23, 42, 0.55)",
            }}
          >
            {LINES.map((line) => (
              <div
                key={line}
                style={{
                  color: line.includes("switch") ? COLORS.cyan : COLORS.muted,
                  fontFamily: FONTS.mono,
                  fontSize: 38,
                  fontWeight: 700,
                  lineHeight: 1.45,
                }}
              >
                {line}
              </div>
            ))}
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 500,
              transform: "translate(-50%, -50%)",
              opacity: iconIn,
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <GitBranch size={44} color={COLORS.green} strokeWidth={1.6} />
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 38, fontWeight: 750}}>
              type switch
            </div>
            <Checkmark progress={checkIn} size={40} />
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
