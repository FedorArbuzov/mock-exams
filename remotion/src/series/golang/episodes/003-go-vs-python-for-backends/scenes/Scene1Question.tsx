import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {LangBadge} from "../../../icons/LangBadge";
import {clamp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene1Question: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();

  const approach = progress01(frame, 4, durationInFrames * 0.45);
  const pythonX = interpolate(approach, [0, 1], [220, 420], clamp);
  const goX = interpolate(approach, [0, 1], [860, 660], clamp);
  const impact = progress01(frame, durationInFrames * 0.4, durationInFrames * 0.52);
  const sparkOpacity = interpolate(impact, [0, 0.3, 1], [0, 1, 0], clamp);
  const settleShakeAmt = interpolate(impact, [0, 1], [0, 1], clamp) * Math.sin(frame * 2) * 4 * (1 - impact);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "50%",
          height: "100%",
          background: "radial-gradient(circle at 30% 60%, rgba(251,191,36,0.16), transparent 65%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: "50%",
          height: "100%",
          background: "radial-gradient(circle at 70% 60%, rgba(34,211,238,0.16), transparent 65%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: pythonX - settleShakeAmt,
          top: 800,
          transform: "translate(-50%, -50%)",
        }}
      >
        <LangBadge label="Python" accent="#FBBF24" />
      </div>

      <div
        style={{
          position: "absolute",
          left: goX + settleShakeAmt,
          top: 800,
          transform: "translate(-50%, -50%)",
        }}
      >
        <LangBadge label="Go" accent={COLORS.cyan} emphasis />
      </div>

      <div
        style={{
          position: "absolute",
          left: 540,
          top: 800,
          transform: `translate(-50%, -50%) scale(${1 + impact * 2.2})`,
          width: 90,
          height: 90,
          borderRadius: 99,
          background: "radial-gradient(circle, rgba(255,255,255,0.95), rgba(34,211,238,0.2), transparent)",
          opacity: sparkOpacity,
        }}
      />

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
