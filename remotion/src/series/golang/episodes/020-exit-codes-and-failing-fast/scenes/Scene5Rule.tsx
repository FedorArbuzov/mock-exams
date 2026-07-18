import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {AlertCircle, OctagonX, Workflow} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene5Rule: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const step1 = progress01(frame, 0, 18);
  const arrowIn = progress01(frame, 20, 34);
  const step2 = progress01(frame, 32, 50);
  const noteIn = progress01(frame, 56, 76);

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
            <AlertCircle size={90} color={COLORS.red} strokeWidth={1.6} />
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 24, fontWeight: 700}}>
              print to stderr
            </div>
          </div>

          <div style={{position: "absolute", left: "50%", top: 250, transform: "translate(-50%, 0)", opacity: arrowIn}}>
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
            <OctagonX size={90} color={COLORS.red} strokeWidth={1.6} />
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 24, fontWeight: 700}}>
              exit non-zero
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 570,
              transform: "translate(-50%, -50%)",
              opacity: noteIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Workflow size={54} color={COLORS.cyan} strokeWidth={1.7} />
            <div style={{color: COLORS.cyan, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 700}}>
              scripts depend on it
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
