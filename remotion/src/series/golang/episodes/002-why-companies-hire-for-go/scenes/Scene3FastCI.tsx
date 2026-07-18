import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {BellSlash, ClockIcon, MoonIcon} from "../../../../../shared/components/icons";
import {clamp, fadeSlideUp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const STAGES = ["build", "test", "deploy"];
const BAR_START_END: [number, number] = [10, 55];

export const Scene3FastCI: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();

  const barProgress = interpolate(frame, BAR_START_END, [0, 1], clamp);
  const clockGroupIn = progress01(frame, durationInFrames * 0.62, durationInFrames * 0.78);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 560,
          transform: "translateX(-50%)",
          width: 760,
        }}
      >
        <div
          style={{
            position: "relative",
            height: 4,
            borderRadius: 2,
            background: "rgba(148,163,184,0.2)",
            marginBottom: 40,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: 4,
              borderRadius: 2,
              width: `${barProgress * 100}%`,
              background: COLORS.cyan,
              boxShadow: `0 0 10px ${COLORS.glowCyan}`,
            }}
          />
        </div>

        <div style={{display: "flex", justifyContent: "space-between"}}>
          {STAGES.map((stage, i) => {
            const stageStart = BAR_START_END[0] + ((BAR_START_END[1] - BAR_START_END[0]) * i) / STAGES.length;
            const stageEnd = BAR_START_END[0] + ((BAR_START_END[1] - BAR_START_END[0]) * (i + 1)) / STAGES.length;
            const stageProgress = progress01(frame, stageStart, stageEnd);
            return (
              <div
                key={stage}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                  opacity: interpolate(stageProgress, [0, 0.2], [0.3, 1], clamp),
                }}
              >
                <Checkmark progress={stageProgress} size={56} />
                <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 650}}>
                  {stage}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 1180,
          transform: "translate(-50%, -50%)",
          display: "flex",
          alignItems: "center",
          gap: 34,
          opacity: clockGroupIn,
        }}
      >
        <ClockIcon size={64} color={COLORS.white} />
        <div style={{color: COLORS.white, fontFamily: FONTS.mono, fontSize: 46, fontWeight: 700}}>
          3:00
        </div>
        <MoonIcon size={36} color={COLORS.muted} />
        <BellSlash size={54} />
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
