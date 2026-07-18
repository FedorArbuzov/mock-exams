import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {XMarkGlyph} from "../../../../../shared/components/icons";
import {Terminal} from "../../../icons/Terminal";
import {clamp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const PY_LINES = ["$ python app.py", "Running...", "NameError: usr", "  is not defined"];
const GO_LINES = ["$ go build", "undefined: usr", "build failed"];

const TimelineBar: React.FC<{
  zones: [string, string];
  failFraction: number;
  reachedFraction: number;
  accent: string;
  progress: number;
}> = ({zones, failFraction, reachedFraction, accent, progress}) => {
  const reach = interpolate(progress, [0, 1], [0, reachedFraction], clamp);
  const xShow = interpolate(progress, [0.82, 0.92], [0, 1], clamp);

  return (
    <div style={{width: 620}}>
      <div
        style={{
          position: "relative",
          height: 10,
          borderRadius: 6,
          background: "rgba(148,163,184,0.18)",
          overflow: "visible",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: -3,
            bottom: -3,
            width: 2,
            background: COLORS.border,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: 10,
            borderRadius: 6,
            width: `${reach * 100}%`,
            background: accent,
            boxShadow: `0 0 10px ${accent}88`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: `${failFraction * 100}%`,
            top: -16,
            transform: "translate(-50%, -100%)",
            opacity: xShow,
          }}
        >
          <XMarkGlyph size={30} color={COLORS.red} />
        </div>
      </div>
      <div style={{display: "flex", justifyContent: "space-between", marginTop: 8}}>
        <div style={{color: COLORS.muted, fontSize: 18, fontWeight: 620}}>{zones[0]}</div>
        <div style={{color: COLORS.muted, fontSize: 18, fontWeight: 620, opacity: reachedFraction > 0.5 ? 1 : 0.4}}>
          {zones[1]}
        </div>
      </div>
    </div>
  );
};

export const Scene3CompileTime: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const typedEnd = Math.floor(durationInFrames * 0.42);
  const pyTyped = Math.round(
    interpolate(frame, [4, typedEnd], [0, PY_LINES.join("\n").length], clamp),
  );
  const goTyped = Math.round(
    interpolate(frame, [4, typedEnd], [0, GO_LINES.join("\n").length], clamp),
  );
  const timelineProgress = progress01(frame, typedEnd, typedEnd + 24);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 420,
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        <Terminal typedChars={pyTyped} lines={PY_LINES} title="python — runtime" width={620} accent="#FBBF24" />
        <TimelineBar
          zones={["start", "running"]}
          failFraction={0.72}
          reachedFraction={0.72}
          accent="#FBBF24"
          progress={timelineProgress}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 1180,
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        <Terminal typedChars={goTyped} lines={GO_LINES} title="go — before it ever runs" width={620} accent={COLORS.cyan} />
        <TimelineBar
          zones={["build", "run"]}
          failFraction={0.22}
          reachedFraction={0.22}
          accent={COLORS.cyan}
          progress={timelineProgress}
        />
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
