import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Repeat} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const LINES = [
  "for _, x := range xs {",
  "  y := transform(x)",
  "  // y shadows outer y",
] as const;

export const Scene4Loops: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const codeIn = progress01(frame, 0, 24);
  const loopIn = progress01(frame, 28, 48);
  const labelIn = progress01(frame, 52, 72);

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
                  color: line.includes(":=") ? COLORS.cyan : COLORS.muted,
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
              opacity: loopIn,
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <Repeat size={44} color={COLORS.cyan} strokeWidth={1.6} />
            <div style={{color: COLORS.cyan, fontFamily: FONTS.sans, fontSize: 38, fontWeight: 750, opacity: labelIn}}>
              inner scopes too
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
