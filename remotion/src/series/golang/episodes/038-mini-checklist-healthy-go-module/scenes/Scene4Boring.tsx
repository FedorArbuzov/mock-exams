import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Terminal, Unlock, UserRound} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const STEPS = [
  {label: "new contributor", Icon: UserRound, color: COLORS.muted},
  {label: "two commands", Icon: Terminal, color: COLORS.cyan},
  {label: "unblocked", Icon: Unlock, color: COLORS.green},
];

export const Scene4Boring: React.FC<Props> = ({text, durationInFrames}) => {
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
        <Panel width={960} height={620}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 130,
              transform: "translate(-50%, -50%)",
              color: COLORS.white,
              fontFamily: FONTS.sans,
              fontSize: 22,
              fontWeight: 700,
              opacity: progress01(frame, 0, 20),
            }}
          >
            boring to clone
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              top: 340,
              width: 960,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-evenly",
            }}
          >
            {STEPS.map((s, i) => {
              const delay = 30 + i * 30;
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
                    <Icon size={72} color={s.color} strokeWidth={1.6} />
                    <div
                      style={{
                        color: COLORS.white,
                        fontFamily: FONTS.sans,
                        fontSize: 19,
                        fontWeight: 700,
                        textAlign: "center",
                      }}
                    >
                      {s.label}
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{opacity: progress01(frame, delay + 20, delay + 36)}}>
                      <Arrow direction="right" size={38} color={COLORS.muted} />
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
