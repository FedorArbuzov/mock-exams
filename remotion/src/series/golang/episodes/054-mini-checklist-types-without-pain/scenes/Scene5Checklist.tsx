import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const ITEMS = [
  "zero value safe",
  "explicit conversions",
  "no shadowed err",
  "nil pointers handled",
] as const;

export const Scene5Checklist: React.FC<Props> = ({text, durationInFrames}) => {
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
        <Panel width={920} height={780}>
          {ITEMS.map((item, i) => {
            const stepIn = progress01(frame, 6 + i * 22, 24 + i * 22);
            return (
              <div
                key={item}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: 100 + i * 150,
                  width: 780,
                  transform: `translate(-50%, -50%) translateY(${(1 - stepIn) * 10}px)`,
                  opacity: stepIn,
                  display: "flex",
                  alignItems: "center",
                  gap: 22,
                  padding: "18px 24px",
                  borderRadius: 14,
                  border: `1.5px solid ${COLORS.border}`,
                  background: "rgba(15, 23, 42, 0.55)",
                }}
              >
                <Checkmark progress={stepIn} size={42} />
                <div
                  style={{
                    color: COLORS.cyan,
                    fontFamily: FONTS.mono,
                    fontSize: 38,
                    fontWeight: 750,
                  }}
                >
                  {i + 1}. {item}
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
