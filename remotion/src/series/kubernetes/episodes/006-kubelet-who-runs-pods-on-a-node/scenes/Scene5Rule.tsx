import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene5Rule: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 24);
  const arrowIn = progress01(frame, 28, 48);
  const rightIn = progress01(frame, 52, 76);
  const ruleIn = progress01(frame, 80, 100);

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
              left: 220,
              top: 300,
              transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 12}px)`,
              opacity: leftIn,
              padding: "20px 28px",
              borderRadius: 14,
              border: `2px solid ${COLORS.kubernetesBlue}`,
              color: COLORS.kubernetesBlue,
              fontFamily: FONTS.sans,
              fontSize: 38,
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            cluster intent
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 300,
              opacity: arrowIn,
            }}
          >
            <Arrow direction="right" size={48} color={COLORS.cyan} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 740,
              top: 300,
              transform: `translate(-50%, -50%) translateY(${(1 - rightIn) * 12}px)`,
              opacity: rightIn,
              padding: "20px 28px",
              borderRadius: 14,
              border: `2px solid ${COLORS.green}`,
              color: COLORS.green,
              fontFamily: FONTS.sans,
              fontSize: 38,
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            containers on metal
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 480,
              transform: "translate(-50%, -50%)",
              opacity: rightIn,
              color: COLORS.green,
              fontFamily: FONTS.mono,
              fontSize: 50,
              fontWeight: 800,
              textShadow: `0 0 16px ${COLORS.glowGreen}`,
            }}
          >
            kubelet
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 600,
              transform: "translate(-50%, -50%)",
              opacity: ruleIn,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Checkmark progress={ruleIn} size={44} />
            <div style={{color: COLORS.cyan, fontFamily: FONTS.sans, fontSize: 38, fontWeight: 750}}>
              trust node signals
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
