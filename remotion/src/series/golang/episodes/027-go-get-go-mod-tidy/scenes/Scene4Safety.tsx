import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {FileText, FlaskConical} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene4Safety: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const step1 = progress01(frame, 0, 18);
  const arrow1 = progress01(frame, 20, 34);
  const step2 = progress01(frame, 32, 50);
  const checkIn = progress01(frame, 56, 76);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 800,
          transform: "translate(-50%, -50%)",
        }}
      >
        <Panel width={700} height={720}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 130,
              transform: `translate(-50%, -50%) translateY(${(1 - step1) * 14}px)`,
              opacity: step1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <FileText size={90} color={COLORS.cyan} strokeWidth={1.6} />
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 24, fontWeight: 700}}>
              read changelog
            </div>
          </div>

          <div style={{position: "absolute", left: "50%", top: 250, transform: "translate(-50%, 0)", opacity: arrow1}}>
            <Arrow direction="down" size={50} color={COLORS.muted} />
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 400,
              transform: `translate(-50%, -50%) translateY(${(1 - step2) * 14}px)`,
              opacity: step2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <FlaskConical size={90} color={COLORS.cyan} strokeWidth={1.6} />
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 24, fontWeight: 700}}>
              run tests
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 570,
              transform: "translate(-50%, -50%)",
              opacity: checkIn,
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <Checkmark progress={checkIn} size={56} />
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 24, fontWeight: 750}}>
              safe to merge
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
