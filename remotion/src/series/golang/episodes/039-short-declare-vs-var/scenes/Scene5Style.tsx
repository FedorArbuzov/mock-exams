import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Anchor, Lock, Variable} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const ITEMS = [
  {label: ":= for locals", Icon: Variable},
  {label: "var for zero value", Icon: Anchor},
  {label: "const for fixed", Icon: Lock},
];

export const Scene5Style: React.FC<Props> = ({text, durationInFrames}) => {
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
            {ITEMS.map((it, i) => {
              const delay = 8 + i * 26;
              const nodeIn = progress01(frame, delay, delay + 16);
              const checkIn = progress01(frame, delay + 14, delay + 30);
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
                  <div style={{color: COLORS.white, fontFamily: FONTS.mono, fontSize: 34, fontWeight: 700}}>
                    {it.label}
                  </div>
                  <Checkmark progress={checkIn} size={36} />
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
