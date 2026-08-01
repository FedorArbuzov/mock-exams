import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {AlertTriangle, Clock, History, Users} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const PAINS = [
  {icon: Clock, label: "same VPC next week"},
  {icon: Users, label: "teammate rebuilds"},
  {icon: History, label: "no history"},
] as const;

export const Scene2Pain: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const titleIn = progress01(frame, 0, 20);

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
              left: "50%",
              top: 160,
              transform: "translate(-50%, -50%)",
              opacity: titleIn,
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <AlertTriangle size={48} color={COLORS.red} strokeWidth={1.6} />
            <div
              style={{
                color: COLORS.red,
                fontFamily: FONTS.mono,
                fontSize: 44,
                fontWeight: 800,
              }}
            >
              ClickOps pain
            </div>
          </div>

          {PAINS.map((pain, i) => {
            const painIn = progress01(frame, 18 + i * 14, 36 + i * 14);
            const Icon = pain.icon;
            return (
              <div
                key={pain.label}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: 280 + i * 110,
                  transform: `translate(-50%, -50%) translateY(${(1 - painIn) * 14}px)`,
                  opacity: painIn,
                  width: 820,
                  padding: "22px 28px",
                  borderRadius: 14,
                  border: `1.5px solid ${COLORS.border}`,
                  background: "rgba(15, 23, 42, 0.55)",
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                }}
              >
                <Icon size={44} color={COLORS.red} strokeWidth={1.6} />
                <div
                  style={{
                    color: COLORS.white,
                    fontFamily: FONTS.sans,
                    fontSize: 38,
                    fontWeight: 750,
                  }}
                >
                  {pain.label}
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
