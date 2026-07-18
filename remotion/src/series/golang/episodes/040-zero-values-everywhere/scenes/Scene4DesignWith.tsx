import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene4DesignWith: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const boxIn = progress01(frame, 0, 22);
  const checkIn = progress01(frame, 74, 94);

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
        <Panel width={900} height={700}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 260,
              transform: `translate(-50%, -50%) translateY(${(1 - boxIn) * 10}px)`,
              opacity: boxIn,
              padding: "28px 36px",
              borderRadius: 16,
              border: `1.5px solid ${COLORS.cyan}88`,
              fontFamily: FONTS.mono,
              fontSize: 38,
              fontWeight: 700,
              color: COLORS.white,
              lineHeight: 1.7,
            }}
          >
            <div style={{color: COLORS.cyan}}>Config{"{}"}</div>
            <div>Timeout: 0</div>
            <div>Retries: 0</div>
            <div>Enabled: false</div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 540,
              transform: `translate(-50%, -50%) translateY(${(1 - checkIn) * 10}px)`,
              opacity: checkIn,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Checkmark progress={checkIn} size={54} />
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 38, fontWeight: 750}}>
              already correct, no extra setup
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
