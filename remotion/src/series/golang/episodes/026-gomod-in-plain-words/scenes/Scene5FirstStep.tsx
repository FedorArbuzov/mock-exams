import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {FileCode, Folder, PackagePlus} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const STEPS = [
  {label: "create folder", Icon: Folder},
  {label: "init module", Icon: PackagePlus},
  {label: "write code", Icon: FileCode},
];

export const Scene5FirstStep: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();

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
        <Panel width={980} height={460}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 980,
              height: 460,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-evenly",
            }}
          >
            {STEPS.map((step, i) => {
              const delay = 8 + i * 26;
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
                    <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 700}}>
                      {step.label}
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{opacity: arrowIn}}>
                      <Arrow direction="right" size={44} color={COLORS.muted} />
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
