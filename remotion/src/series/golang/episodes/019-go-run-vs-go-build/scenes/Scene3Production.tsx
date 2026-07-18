import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Hammer, Play, Tag} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const STEPS = [
  {label: "prototype", Icon: Play, color: COLORS.green},
  {label: "verify build", Icon: Hammer, color: COLORS.cyan},
  {label: "tag release", Icon: Tag, color: COLORS.white},
];

export const Scene3Production: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const labelIn = progress01(frame, 96, 116);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 850,
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Panel width={640} height={700}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 60,
              width: 640,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {STEPS.map((step, i) => {
              const delay = 6 + i * 30;
              const nodeIn = progress01(frame, delay, delay + 16);
              const arrowIn = progress01(frame, delay + 16, delay + 30);
              const Icon = step.Icon;
              return (
                <React.Fragment key={step.label}>
                  <div
                    style={{
                      opacity: nodeIn,
                      transform: `translateY(${(1 - nodeIn) * 14}px)`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 14,
                    }}
                  >
                    <Icon size={90} color={step.color} strokeWidth={1.6} />
                    <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 24, fontWeight: 700}}>
                      {step.label}
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{padding: "20px 0", opacity: arrowIn}}>
                      <Arrow direction="down" size={50} color={COLORS.muted} />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </Panel>

        <div
          style={{
            marginTop: 26,
            color: COLORS.muted,
            fontFamily: FONTS.sans,
            fontSize: 22,
            fontWeight: 650,
            opacity: labelIn,
          }}
        >
          know exactly what shipped
        </div>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
