import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Bug, GitFork, Wrench} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const STEPS = [
  {label: "bug upstream", Icon: Bug, color: COLORS.red},
  {label: "your fork", Icon: GitFork, color: COLORS.cyan},
  {label: "fix it", Icon: Wrench, color: COLORS.green},
];

export const Scene5Trick: React.FC<Props> = ({text, durationInFrames}) => {
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
        <Panel width={960} height={560}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 280,
              width: 960,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-evenly",
            }}
          >
            {STEPS.map((s, i) => {
              const delay = 8 + i * 30;
              const stepIn = progress01(frame, delay, delay + 18);
              const Icon = s.Icon;
              return (
                <React.Fragment key={s.label}>
                  <div
                    style={{
                      opacity: stepIn,
                      transform: `translateY(${(1 - stepIn) * 14}px)`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 14,
                      width: 220,
                    }}
                  >
                    <Icon size={78} color={s.color} strokeWidth={1.6} />
                    <div
                      style={{
                        color: COLORS.white,
                        fontFamily: FONTS.sans,
                        fontSize: 20,
                        fontWeight: 700,
                        textAlign: "center",
                      }}
                    >
                      {s.label}
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{opacity: progress01(frame, delay + 20, delay + 36)}}>
                      <Arrow direction="right" size={40} color={COLORS.muted} />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
