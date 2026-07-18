import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {TriangleAlert} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const CHIPS = ["length limits", "truncation", "validation"] as const;

export const Scene4Breaks: React.FC<Props> = ({text, durationInFrames}) => {
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
        <Panel width={960} height={720}>
          {CHIPS.map((label, i) => {
            const chipIn = progress01(frame, 8 + i * 22, 28 + i * 22);
            return (
              <div
                key={label}
                style={{
                  position: "absolute",
                  left: 160 + i * 280,
                  top: 320,
                  transform: `translate(-50%, -50%) translateX(${(1 - chipIn) * -24}px)`,
                  opacity: chipIn,
                  width: 240,
                  padding: "24px 16px",
                  borderRadius: 14,
                  border: `1.5px solid ${COLORS.red}88`,
                  background: "rgba(248, 113, 113, 0.08)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                  boxShadow: `0 0 18px rgba(248, 113, 113, 0.12)`,
                }}
              >
                <TriangleAlert size={44} color={COLORS.red} strokeWidth={1.8} />
                <div
                  style={{
                    color: COLORS.white,
                    fontFamily: FONTS.sans,
                    fontSize: 34,
                    fontWeight: 750,
                    textAlign: "center",
                  }}
                >
                  {label}
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
