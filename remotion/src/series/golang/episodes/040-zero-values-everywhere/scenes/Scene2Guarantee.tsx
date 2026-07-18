import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Hash, Link2Off, ToggleLeft, Type} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const ROW1 = [
  {label: "numbers", value: "0", Icon: Hash},
  {label: "booleans", value: "false", Icon: ToggleLeft},
  {label: "strings", value: '""', Icon: Type},
];
const ROW2 = [{label: "pointers, slices, maps...", value: "nil", Icon: Link2Off}];

export const Scene2Guarantee: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const ciIn = progress01(frame, 100, 120);

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
        <Panel width={960} height={880}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 130,
              width: 960,
              display: "flex",
              justifyContent: "space-evenly",
            }}
          >
            {ROW1.map((it, i) => {
              const delay = 10 + i * 24;
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
                    gap: 12,
                    width: 260,
                  }}
                >
                  <Icon size={58} color={COLORS.cyan} strokeWidth={1.6} />
                  <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 30, fontWeight: 700}}>
                    {it.label}
                  </div>
                  <div style={{color: COLORS.cyan, fontFamily: FONTS.mono, fontSize: 38, fontWeight: 700}}>
                    {it.value}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 480,
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              opacity: progress01(frame, 60, 80),
            }}
          >
            {ROW2.map((it) => {
              const Icon = it.Icon;
              return (
                <React.Fragment key={it.label}>
                  <Icon size={58} color={COLORS.cyan} strokeWidth={1.6} />
                  <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 30, fontWeight: 700}}>
                    {it.label}
                  </div>
                  <div style={{color: COLORS.cyan, fontFamily: FONTS.mono, fontSize: 38, fontWeight: 700}}>
                    {it.value}
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              top: 660,
              width: 960,
              height: 1,
              background: COLORS.border,
            }}
          />

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 770,
              transform: `translate(-50%, -50%) translateY(${(1 - ciIn) * 10}px)`,
              opacity: ciIn,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Checkmark progress={ciIn} size={44} />
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 750}}>
              no garbage memory
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
