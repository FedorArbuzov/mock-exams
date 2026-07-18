import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {AppWindow, Package, Rocket, Wrench} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const CHECKPOINTS = [
  {label: "module", Icon: Package},
  {label: "toolchain", Icon: Wrench},
  {label: "editor", Icon: AppWindow},
];

export const Scene4HelloWorldProof: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const runIn = progress01(frame, 90, 112);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 820,
          transform: "translate(-50%, -50%)",
        }}
      >
        <Panel width={920} height={700}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 90,
              width: 920,
              display: "flex",
              justifyContent: "space-evenly",
            }}
          >
            {CHECKPOINTS.map((cp, i) => {
              const delay = 6 + i * 26;
              const nodeIn = progress01(frame, delay, delay + 16);
              const checkIn = progress01(frame, delay + 12, delay + 28);
              const Icon = cp.Icon;
              return (
                <div
                  key={cp.label}
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
                    <Icon size={68} color={COLORS.cyan} strokeWidth={1.6} />
                  </div>
                  <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 700}}>
                    {cp.label}
                  </div>
                  <Checkmark progress={checkIn} size={54} />
                </div>
              );
            })}
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 480,
              transform: `translate(-50%, -50%) scale(${0.9 + runIn * 0.1})`,
              opacity: runIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Rocket size={90} color={COLORS.green} strokeWidth={1.5} />
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 30, fontWeight: 750}}>
              it runs
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
