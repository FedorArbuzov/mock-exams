import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {ArrowUpDown, Scissors, Shuffle} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const ITEMS = [
  {label: "truncation", Icon: Scissors},
  {label: "sign surprises", Icon: ArrowUpDown},
  {label: "mixed types", Icon: Shuffle},
];

export const Scene3Prevents: React.FC<Props> = ({text, durationInFrames}) => {
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
              color: COLORS.red,
              fontFamily: FONTS.sans,
              fontSize: 34,
              fontWeight: 700,
              opacity: progress01(frame, 0, 20),
            }}
          >
            prevented at compile time
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              top: 320,
              width: 960,
              display: "flex",
              justifyContent: "space-evenly",
            }}
          >
            {ITEMS.map((it, i) => {
              const delay = 30 + i * 26;
              const itIn = progress01(frame, delay, delay + 18);
              const Icon = it.Icon;
              return (
                <div
                  key={it.label}
                  style={{
                    opacity: itIn,
                    transform: `translateY(${(1 - itIn) * 12}px)`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 14,
                  }}
                >
                  <Icon size={64} color={COLORS.cyan} strokeWidth={1.6} />
                  <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 700}}>
                    {it.label}
                  </div>
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
