import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const STEPS = [
  "kubectl describe node",
  "systemctl status kubelet",
  "journalctl -u kubelet",
] as const;

export const Scene4Check: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();

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
        <Panel width={920} height={720}>
          {STEPS.map((step, i) => {
            const stepIn = progress01(frame, 8 + i * 28, 30 + i * 28);
            return (
              <div
                key={step}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: 160 + i * 170,
                  width: 780,
                  transform: `translate(-50%, -50%) translateY(${(1 - stepIn) * 12}px)`,
                  opacity: stepIn,
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                  padding: "20px 26px",
                  borderRadius: 14,
                  border: `1.5px solid ${COLORS.border}`,
                  background: "rgba(15, 23, 42, 0.55)",
                }}
              >
                <Checkmark progress={stepIn} size={44} />
                <div style={{color: COLORS.cyan, fontFamily: FONTS.mono, fontSize: 36, fontWeight: 750}}>
                  {step}
                </div>
              </div>
            );
          })}
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
