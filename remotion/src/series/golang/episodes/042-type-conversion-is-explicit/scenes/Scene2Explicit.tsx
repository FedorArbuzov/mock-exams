import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene2Explicit: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 20);
  const arrowIn = progress01(frame, 30, 48);
  const rightIn = progress01(frame, 46, 66);
  const checkIn = progress01(frame, 80, 100);

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
        <Panel width={950} height={720}>
          <div
            style={{
              position: "absolute",
              left: 220,
              top: 220,
              transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 12}px)`,
              opacity: leftIn,
              padding: "16px 24px",
              borderRadius: 12,
              border: `1.5px solid ${COLORS.border}`,
              color: COLORS.white,
              fontFamily: FONTS.mono,
              fontSize: 38,
              fontWeight: 700,
            }}
          >
            var x int32 = 5
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 220,
              transform: "translate(-50%, -50%)",
              opacity: arrowIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Arrow direction="right" size={54} color={COLORS.cyan} />
            <div style={{color: COLORS.cyan, fontFamily: FONTS.sans, fontSize: 30, fontWeight: 700}}>
              convert
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 750,
              top: 220,
              transform: `translate(-50%, -50%) translateY(${(1 - rightIn) * 12}px)`,
              opacity: rightIn,
              padding: "16px 24px",
              borderRadius: 12,
              border: `1.5px solid ${COLORS.cyan}88`,
              color: COLORS.cyan,
              fontFamily: FONTS.mono,
              fontSize: 38,
              fontWeight: 700,
            }}
          >
            int64(x)
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 460,
              transform: "translate(-50%, -50%)",
              opacity: checkIn,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Checkmark progress={checkIn} size={54} />
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 38, fontWeight: 750}}>
              compiler forces you to acknowledge it
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
