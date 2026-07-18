import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene2Rule: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const baseIn = progress01(frame, 0, 22);
  const segIn = progress01(frame, 34, 56);
  const labelIn = progress01(frame, 66, 86);

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
        <Panel width={960} height={620}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 250,
              transform: "translate(-50%, -50%)",
              opacity: baseIn,
              display: "flex",
              alignItems: "center",
              fontFamily: FONTS.mono,
              fontSize: 32,
              fontWeight: 700,
            }}
          >
            <span style={{color: COLORS.white}}>github.com/acme/lib</span>
            <span
              style={{
                color: COLORS.cyan,
                opacity: segIn,
                transform: `scale(${0.7 + segIn * 0.3})`,
                display: "inline-block",
                marginLeft: 4,
                textShadow: `0 0 16px ${COLORS.glowCyan}`,
              }}
            >
              /v2
            </span>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 420,
              transform: `translate(-50%, -50%) translateY(${(1 - labelIn) * 10}px)`,
              opacity: labelIn,
              color: COLORS.cyan,
              fontFamily: FONTS.sans,
              fontSize: 24,
              fontWeight: 750,
              textAlign: "center",
            }}
          >
            major version lives inside the path
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
