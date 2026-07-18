import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene2Usage: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 20);
  const rightIn = progress01(frame, 14, 34);

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
              left: 260,
              top: 220,
              transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 12}px)`,
              opacity: leftIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                padding: "16px 24px",
                borderRadius: 12,
                border: `1.5px solid ${COLORS.cyan}88`,
                color: COLORS.cyan,
                fontFamily: FONTS.mono,
                fontSize: 42,
                fontWeight: 700,
              }}
            >
              count := 0
            </div>
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 700, textAlign: "center"}}>
              create + assign
              <br />
              in one step
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 700,
              top: 220,
              transform: `translate(-50%, -50%) translateY(${(1 - rightIn) * 12}px)`,
              opacity: rightIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                padding: "16px 24px",
                borderRadius: 12,
                border: `1.5px solid ${COLORS.border}`,
                color: COLORS.white,
                fontFamily: FONTS.mono,
                fontSize: 42,
                fontWeight: 700,
              }}
            >
              var err error
            </div>
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 700, textAlign: "center"}}>
              zero value first,
              <br />
              or package level
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 480,
              transform: "translate(-50%, -50%)",
              opacity: (leftIn + rightIn) / 2,
              color: COLORS.muted,
              fontFamily: FONTS.sans,
              fontSize: 30,
              fontWeight: 650,
            }}
          >
short declaration only works inside functions
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
