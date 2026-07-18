import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {ArrowRight} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const STEPS = ["decode any", "assert struct", "concrete logic"] as const;

export const Scene5Pattern: React.FC<Props> = ({text, durationInFrames}) => {
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
        <Panel width={980} height={480}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 980,
              height: 480,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-evenly",
            }}
          >
            {STEPS.map((step, i) => {
              const delay = 8 + i * 26;
              const nodeIn = progress01(frame, delay, delay + 16);
              const checkIn = progress01(frame, delay + 14, delay + 30);
              return (
                <React.Fragment key={step}>
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
                        padding: "16px 20px",
                        borderRadius: 14,
                        border: `2px solid ${COLORS.cyan}`,
                        color: COLORS.cyan,
                        fontFamily: FONTS.mono,
                        fontSize: 34,
                        fontWeight: 750,
                        textAlign: "center",
                      }}
                    >
                      {step}
                    </div>
                    <Checkmark progress={checkIn} size={36} />
                  </div>
                  {i < STEPS.length - 1 && (
                    <ArrowRight
                      size={40}
                      color={COLORS.muted}
                      strokeWidth={1.6}
                      style={{opacity: nodeIn * 0.6}}
                    />
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
