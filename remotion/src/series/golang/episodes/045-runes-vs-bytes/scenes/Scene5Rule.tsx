import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const STEPS = ["len → bytes", "range → runes", "utf8 package"] as const;

export const Scene5Rule: React.FC<Props> = ({text, durationInFrames}) => {
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
            const stepIn = progress01(frame, 6 + i * 28, 28 + i * 28);
            return (
              <div
                key={step}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: 180 + i * 150,
                  width: 780,
                  transform: `translate(-50%, -50%) translateY(${(1 - stepIn) * 12}px)`,
                  opacity: stepIn,
                  display: "flex",
                  alignItems: "center",
                  gap: 28,
                  padding: "22px 28px",
                  borderRadius: 14,
                  border: `1.5px solid ${COLORS.border}`,
                  background: "rgba(15, 23, 42, 0.55)",
                }}
              >
                <Checkmark progress={stepIn} size={48} />
                <div
                  style={{
                    color: COLORS.cyan,
                    fontFamily: FONTS.mono,
                    fontSize: 42,
                    fontWeight: 750,
                  }}
                >
                  {i + 1}. {step}
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
