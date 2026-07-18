import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const TYPES = ["UserID", "OrderID", "cents"] as const;

export const Scene4Domain: React.FC<Props> = ({text, durationInFrames}) => {
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
        <Panel width={920} height={680}>
          {TYPES.map((t, i) => {
            const stepIn = progress01(frame, 6 + i * 24, 24 + i * 24);
            return (
              <div
                key={t}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: 140 + i * 160,
                  width: 760,
                  transform: `translate(-50%, -50%) translateY(${(1 - stepIn) * 12}px)`,
                  opacity: stepIn,
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                  padding: "18px 26px",
                  borderRadius: 14,
                  border: `1.5px solid ${COLORS.cyan}66`,
                  background: "rgba(15, 23, 42, 0.55)",
                }}
              >
                <Checkmark progress={stepIn} size={42} />
                <div
                  style={{
                    color: COLORS.cyan,
                    fontFamily: FONTS.mono,
                    fontSize: 42,
                    fontWeight: 750,
                  }}
                >
                  type {t} int
                </div>
              </div>
            );
          })}

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 620,
              transform: "translate(-50%, -50%)",
              opacity: progress01(frame, 78, 98),
              color: COLORS.green,
              fontFamily: FONTS.sans,
              fontSize: 38,
              fontWeight: 750,
            }}
          >
            domain meaning
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
