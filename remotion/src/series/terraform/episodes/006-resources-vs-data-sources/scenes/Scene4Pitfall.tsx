import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Copy, ShieldOff} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene4Pitfall: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 24);
  const rightIn = progress01(frame, 28, 52);
  const labelIn = progress01(frame, 56, 80);

  return (
    <AbsoluteFill>
      <div style={{position: "absolute", left: "50%", top: 780, transform: "translate(-50%, -50%)"}}>
        <Panel width={960} height={720} accent={COLORS.red}>
          <div
            style={{
              position: "absolute",
              left: 260,
              top: 280,
              transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 12}px)`,
              opacity: leftIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <ShieldOff size={56} color={COLORS.red} strokeWidth={1.6} />
            <div style={{color: COLORS.red, fontFamily: FONTS.sans, fontSize: 38, fontWeight: 750, textAlign: "center"}}>
              data everything
            </div>
            <div style={{color: COLORS.muted, fontFamily: FONTS.mono, fontSize: 38, fontWeight: 700}}>
              no clean stack
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 280,
              width: 1,
              height: 180,
              background: COLORS.border,
              opacity: (leftIn + rightIn) / 2,
            }}
          />

          <div
            style={{
              position: "absolute",
              left: 700,
              top: 280,
              transform: `translate(-50%, -50%) translateY(${(1 - rightIn) * 12}px)`,
              opacity: rightIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Copy size={56} color={COLORS.red} strokeWidth={1.6} />
            <div style={{color: COLORS.red, fontFamily: FONTS.sans, fontSize: 38, fontWeight: 750, textAlign: "center"}}>
              resource-copy VPC
            </div>
            <div style={{color: COLORS.muted, fontFamily: FONTS.mono, fontSize: 38, fontWeight: 700}}>
              vpc-1 … vpc-5
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 540,
              transform: "translate(-50%, -50%)",
              opacity: labelIn,
              color: COLORS.white,
              fontFamily: FONTS.sans,
              fontSize: 38,
              fontWeight: 720,
              textAlign: "center",
              width: 760,
            }}
          >
            two beginner traps
          </div>
        </Panel>
      </div>
      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
