import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {CircleSlash} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const ITEMS = [
  {code: "var s []int", label: "nil slice"},
  {code: "var m map[K]V", label: "nil map"},
] as const;

export const Scene2Zero: React.FC<Props> = ({text, durationInFrames}) => {
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
            return (
              <div
                key={item.code}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: 180 + i * 180,
                  width: 780,
                  transform: `translate(-50%, -50%) translateY(${(1 - stepIn) * 12}px)`,
                  opacity: stepIn,
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                  padding: "22px 28px",
                  borderRadius: 14,
                  border: `1.5px solid ${COLORS.border}`,
                  background: "rgba(15, 23, 42, 0.55)",
                }}
              >
                <CircleSlash size={44} color={COLORS.cyan} strokeWidth={1.6} />
                <div
                  style={{
                    color: COLORS.cyan,
                    fontFamily: FONTS.mono,
                    fontSize: 38,
                    fontWeight: 750,
                  }}
                >
                  {item.code}
                </div>
                <Checkmark progress={stepIn} size={40} />
                <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 700}}>
                  {item.label}
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
