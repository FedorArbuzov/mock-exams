import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Lock, Tag} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const STEPS = [
  {label: "private repo", Icon: Lock},
  {label: "path + tag", Icon: Tag},
];

export const Scene3NotFetchable: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const checkIn = progress01(frame, 76, 96);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 800,
          transform: "translate(-50%, -50%)",
        }}
      >
        <Panel width={960} height={560}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 60,
              width: 960,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-evenly",
            }}
          >
            {STEPS.map((step, i) => {
              const delay = 6 + i * 26;
              const nodeIn = progress01(frame, delay, delay + 16);
              const arrowIn = progress01(frame, delay + 14, delay + 28);
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
                    <div
                      style={{
                        width: 130,
                        height: 130,
                        borderRadius: 24,
                        border: `2px solid ${COLORS.cyan}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon size={64} color={COLORS.cyan} strokeWidth={1.6} />
                    </div>
                    <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 24, fontWeight: 700}}>
                      {step.label}
                    </div>
                  </div>
                  <div style={{opacity: arrowIn}}>
                    <Arrow direction="right" size={44} color={COLORS.muted} />
                  </div>
                </React.Fragment>
              );
            })}

            <div
              style={{
                opacity: checkIn,
                transform: `translateY(${(1 - checkIn) * 14}px)`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 14,
              }}
            >
              <Checkmark progress={checkIn} size={90} />
              <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 24, fontWeight: 700}}>
                version resolved
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
