import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Sparkles} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene4Whennew: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const mainIn = progress01(frame, 0, 24);
  const labelIn = progress01(frame, 36, 58);
  const checkIn = progress01(frame, 72, 94);

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
        <Panel width={920} height={620}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 240,
              transform: `translate(-50%, -50%) translateY(${(1 - mainIn) * 12}px)`,
              opacity: mainIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 18,
            }}
          >
            <Sparkles size={64} color={COLORS.cyan} strokeWidth={1.6} />
            <div
              style={{
                padding: "16px 28px",
                borderRadius: 12,
                border: `1.5px solid ${COLORS.cyan}88`,
                color: COLORS.cyan,
                fontFamily: FONTS.mono,
                fontSize: 46,
                fontWeight: 750,
              }}
            >
              new(T)
            </div>
            <div
              style={{
                opacity: labelIn,
                color: COLORS.muted,
                fontFamily: FONTS.sans,
                fontSize: 38,
                fontWeight: 750,
                textAlign: "center",
                lineHeight: 1.4,
              }}
            >
              zeroed pointer
              <br />
              fill later
            </div>
            <Checkmark progress={checkIn} size={44} />
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
