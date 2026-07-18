import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const COMMANDS = [
  "kubectl get nodes -o wide",
  "kubectl describe node",
] as const;

const CONDITIONS = ["Ready", "MemoryPressure", "DiskPressure"] as const;

export const Scene4Check: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const cmdIn = progress01(frame, 0, 40);
  const condIn = progress01(frame, 44, 72);

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
          {COMMANDS.map((cmd, i) => {
            const stepIn = progress01(frame, 8 + i * 28, 30 + i * 28);
            return (
              <div
                key={cmd}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: 180 + i * 130,
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
                  {cmd}
                </div>
              </div>
            );
          })}

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 500,
              transform: "translate(-50%, -50%)",
              opacity: condIn,
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              width: 780,
              justifyContent: "center",
            }}
          >
            {CONDITIONS.map((c, i) => {
              const cIn = progress01(frame, 48 + i * 10, 64 + i * 10);
              return (
                <div
                  key={c}
                  style={{
                    opacity: cIn,
                    padding: "12px 18px",
                    borderRadius: 10,
                    border: `1px solid ${COLORS.green}`,
                    color: COLORS.green,
                    fontFamily: FONTS.mono,
                    fontSize: 34,
                    fontWeight: 700,
                  }}
                >
                  {c}
                </div>
              );
            })}
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 620,
              transform: "translate(-50%, -50%)",
              opacity: cmdIn * condIn,
              color: COLORS.white,
              fontFamily: FONTS.sans,
              fontSize: 38,
              fontWeight: 750,
            }}
          >
            app broken or node full?
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
