import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {AppWindow, Braces, Save} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const STEPS = [
  {label: "editor", Icon: AppWindow},
  {label: "on save", Icon: Save},
  {label: "gofmt runs", Icon: Braces},
];

export const Scene4EditorIntegration: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const checkIn = progress01(frame, 90, 108);

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
        <Panel width={640} height={700}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 40,
              width: 640,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {STEPS.map((step, i) => {
              const delay = 6 + i * 28;
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
                    <Icon size={86} color={COLORS.cyan} strokeWidth={1.6} />
                    <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 24, fontWeight: 700}}>
                      {step.label}
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{padding: "16px 0", opacity: arrowIn}}>
                      <Arrow direction="down" size={46} color={COLORS.muted} />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 640,
              transform: "translate(-50%, -50%)",
              opacity: checkIn,
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <Checkmark progress={checkIn} size={56} />
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 700}}>
              turn it on day one
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
