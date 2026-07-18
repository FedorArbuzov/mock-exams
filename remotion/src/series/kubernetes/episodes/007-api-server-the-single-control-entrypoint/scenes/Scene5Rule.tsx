import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Shield} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene5Rule: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const iconIn = progress01(frame, 0, 24);
  const ruleIn = progress01(frame, 28, 56);
  const checkIn = progress01(frame, 60, 84);

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
              top: 180,
              transform: `translate(-50%, -50%) scale(${0.9 + iconIn * 0.1})`,
              opacity: iconIn,
            }}
          >
            <Shield size={120} color={COLORS.kubernetesBlue} strokeWidth={1.4} />
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 340,
              transform: "translate(-50%, -50%)",
              opacity: ruleIn,
              color: COLORS.kubernetesBlue,
              fontFamily: FONTS.sans,
              fontSize: 46,
              fontWeight: 800,
              textAlign: "center",
              width: 780,
              textShadow: `0 0 20px ${COLORS.glowBlue}`,
            }}
          >
            truth gate
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 460,
              transform: "translate(-50%, -50%)",
              opacity: ruleIn,
              color: COLORS.muted,
              fontFamily: FONTS.sans,
              fontSize: 38,
              fontWeight: 650,
              textAlign: "center",
              width: 780,
            }}
          >
            no API · no operations
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 560,
              transform: "translate(-50%, -50%)",
              opacity: checkIn,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Checkmark progress={checkIn} size={44} />
            <div style={{color: COLORS.cyan, fontFamily: FONTS.sans, fontSize: 38, fontWeight: 750}}>
              fix the front door first
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
