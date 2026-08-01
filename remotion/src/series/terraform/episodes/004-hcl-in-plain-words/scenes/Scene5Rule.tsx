import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Eye} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene5Rule: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const eyeIn = progress01(frame, 0, 28);
  const stampIn = progress01(frame, 32, 62);

  return (
    <AbsoluteFill>
      <div style={{position: "absolute", left: "50%", top: 780, transform: "translate(-50%, -50%)"}}>
        <Panel width={920} height={620} accent={COLORS.green}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "38%",
              transform: `translate(-50%, -50%) translateY(${(1 - eyeIn) * 14}px)`,
              opacity: eyeIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Eye size={72} color={COLORS.cyan} strokeWidth={1.6} />
            <div style={{color: COLORS.cyan, fontFamily: FONTS.sans, fontSize: 40, fontWeight: 750}}>
              skim in PR
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "62%",
              transform: `translate(-50%, -50%) rotate(-8deg) scale(${0.85 + stampIn * 0.15})`,
              opacity: stampIn,
              padding: "16px 40px",
              borderRadius: 10,
              border: `3px solid ${COLORS.green}`,
              color: COLORS.green,
              fontFamily: FONTS.sans,
              fontSize: 44,
              fontWeight: 850,
              letterSpacing: 2,
              textTransform: "uppercase",
              textShadow: `0 0 20px ${COLORS.glowGreen}`,
            }}
          >
            simplify
          </div>
        </Panel>
      </div>
      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
