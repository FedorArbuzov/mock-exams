import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {ArrowRightLeft} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene3Convert: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 22);
  const arrowIn = progress01(frame, 24, 42);
  const rightIn = progress01(frame, 44, 64);
  const labelIn = progress01(frame, 68, 88);

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
              left: 240,
              top: 280,
              transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 12}px)`,
              opacity: leftIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                padding: "16px 24px",
                borderRadius: 12,
                border: `1.5px solid ${COLORS.cyan}88`,
                color: COLORS.cyan,
                fontFamily: FONTS.mono,
                fontSize: 46,
                fontWeight: 700,
              }}
            >
              int
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 280,
              transform: "translate(-50%, -50%)",
              opacity: arrowIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Arrow direction="right" size={50} color={COLORS.cyan} />
            <ArrowRightLeft size={36} color={COLORS.muted} strokeWidth={1.6} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 720,
              top: 280,
              transform: `translate(-50%, -50%) translateY(${(1 - rightIn) * 12}px)`,
              opacity: rightIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                padding: "14px 22px",
                borderRadius: 12,
                border: `1.5px solid ${COLORS.green}88`,
                color: COLORS.green,
                fontFamily: FONTS.mono,
                fontSize: 42,
                fontWeight: 750,
              }}
            >
              int32(x)
            </div>
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 750, opacity: labelIn}}>
              explicit cast
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
