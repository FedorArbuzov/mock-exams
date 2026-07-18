import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Clock, FileText} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const ITEMS = [
  {label: "small + defer", Icon: Clock, color: COLORS.cyan},
  {label: "explicit returns", Icon: FileText, color: COLORS.green},
] as const;

export const Scene5Guideline: React.FC<Props> = ({text, durationInFrames}) => {
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
        <Panel width={920} height={620}>
          {ITEMS.map((item, i) => {
            const stepIn = progress01(frame, 8 + i * 32, 30 + i * 32);
            const Icon = item.Icon;
            return (
              <div
                key={item.label}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: 180 + i * 180,
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
                <Icon size={48} color={item.color} strokeWidth={1.6} />
                <Checkmark progress={stepIn} size={44} />
                <div
                  style={{
                    color: item.color,
                    fontFamily: FONTS.mono,
                    fontSize: 42,
                    fontWeight: 750,
                  }}
                >
                  {i + 1}. {item.label}
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
