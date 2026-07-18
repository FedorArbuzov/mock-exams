import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene4PackageLevel: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 20);
  const rightIn = progress01(frame, 44, 64);

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
        <Panel width={940} height={780}>
          <div
            style={{
              position: "absolute",
              left: 40,
              top: 80,
              width: 400,
              height: 560,
              border: `1.5px solid ${COLORS.border}`,
              borderRadius: 16,
              opacity: leftIn,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 70,
              top: 60,
              opacity: leftIn,
              color: COLORS.muted,
              fontFamily: FONTS.mono,
              fontSize: 30,
              fontWeight: 700,
              background: COLORS.background,
              padding: "0 8px",
            }}
          >
            package level
          </div>
          <div
            style={{
              position: "absolute",
              left: 90,
              top: 200,
              opacity: leftIn,
              transform: `translateY(${(1 - leftIn) * 10}px)`,
              display: "flex",
              flexDirection: "column",
              gap: 22,
              color: COLORS.white,
              fontFamily: FONTS.mono,
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            <div>var port = 8080</div>
            <div>const MaxRetries = 3</div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 500,
              top: 80,
              width: 400,
              height: 560,
              border: `1.5px solid ${COLORS.cyan}88`,
              borderRadius: 16,
              opacity: rightIn,
              transform: `translateY(${(1 - rightIn) * 12}px)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 530,
              top: 60,
              opacity: rightIn,
              color: COLORS.cyan,
              fontFamily: FONTS.mono,
              fontSize: 30,
              fontWeight: 700,
              background: COLORS.background,
              padding: "0 8px",
            }}
          >
            inside a function
          </div>
          <div
            style={{
              position: "absolute",
              left: 550,
              top: 220,
              opacity: rightIn,
              transform: `translateY(${(1 - rightIn) * 10}px)`,
              color: COLORS.cyan,
              fontFamily: FONTS.mono,
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            timeout := 5
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
