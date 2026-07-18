import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Binary} from "../../../icons/Binary";
import {clamp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const TARGETS = [
  {dx: -280, label: "linux/amd64"},
  {dx: 0, label: "darwin/arm64"},
  {dx: 280, label: "windows/amd64"},
];

export const Scene4CrossBuild: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const fanOut = progress01(frame, 10, durationInFrames * 0.55);
  const tagsIn = progress01(frame, durationInFrames * 0.5, durationInFrames * 0.68);
  const singleFade = interpolate(fanOut, [0, 0.25], [1, 0], clamp);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 780,
          transform: "translate(-50%, -50%)",
          opacity: singleFade,
        }}
      >
        <Binary label="app" size={130} />
      </div>

      {TARGETS.map((t, i) => {
        const x = interpolate(fanOut, [0, 1], [0, t.dx], clamp);
        const scale = interpolate(fanOut, [0, 1], [0.4, 0.8], clamp);
        return (
          <div key={i} style={{position: "absolute", left: "50%", top: 780, transform: "translate(-50%, -50%)"}}>
            <div
              style={{
                transform: `translateX(${x}px) scale(${scale})`,
                opacity: fanOut,
              }}
            >
              <Binary label="app" size={110} />
            </div>
            <div
              style={{
                position: "absolute",
                left: x - 70,
                top: 90,
                width: 140,
                textAlign: "center",
                color: COLORS.cyan,
                fontFamily: FONTS.mono,
                fontSize: 18,
                fontWeight: 650,
                opacity: tagsIn,
              }}
            >
              {t.label}
            </div>
          </div>
        );
      })}

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
