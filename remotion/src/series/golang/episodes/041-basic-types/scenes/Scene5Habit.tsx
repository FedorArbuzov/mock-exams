import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {FileCode, Hash} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const ITEMS = [
  {label: "int by default", Icon: Hash},
  {label: "sized ints by contract", Icon: FileCode},
];

export const Scene5Habit: React.FC<Props> = ({text, durationInFrames}) => {
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
        <Panel width={940} height={480}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 940,
              height: 480,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-evenly",
            }}
          >
            {ITEMS.map((it, i) => {
              const delay = 10 + i * 30;
              const nodeIn = progress01(frame, delay, delay + 18);
              const checkIn = progress01(frame, delay + 16, delay + 34);
              const Icon = it.Icon;
              return (
                <div
                  key={it.label}
                  style={{
                    opacity: nodeIn,
                    transform: `translateY(${(1 - nodeIn) * 14}px)`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      width: 140,
                      height: 140,
                      borderRadius: 24,
                      border: `2px solid ${COLORS.cyan}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={70} color={COLORS.cyan} strokeWidth={1.6} />
                  </div>
                  <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 700, textAlign: "center"}}>
                    {it.label}
                  </div>
                  <Checkmark progress={checkIn} size={40} />
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
