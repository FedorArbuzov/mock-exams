import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {BookOpen, Hammer, MapPin, TestTube, Wand2} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const ROW1 = [
  {label: "build passes", Icon: Hammer},
  {label: "tidy changes nothing", Icon: Wand2},
  {label: "tests pass", Icon: TestTube},
];
const ROW2 = [
  {label: "module path intentional", Icon: MapPin},
  {label: "exports documented", Icon: BookOpen},
];

export const Scene2Checks: React.FC<Props> = ({text, durationInFrames}) => {
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
        <Panel width={960} height={860}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 140,
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
                  <Icon size={60} color={COLORS.cyan} strokeWidth={1.6} />
                  <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 19, fontWeight: 700, textAlign: "center"}}>
                    {it.label}
                  </div>
                  <Checkmark progress={itIn} size={36} />
                </div>
              );
            })}
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              top: 500,
              width: 960,
              display: "flex",
              justifyContent: "space-evenly",
              paddingLeft: 130,
              paddingRight: 130,
            }}
          >
            {ROW2.map((it, i) => {
              const delay = 90 + i * 24;
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
                  <Icon size={60} color={COLORS.cyan} strokeWidth={1.6} />
                  <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 19, fontWeight: 700, textAlign: "center"}}>
                    {it.label}
                  </div>
                  <Checkmark progress={itIn} size={36} />
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
