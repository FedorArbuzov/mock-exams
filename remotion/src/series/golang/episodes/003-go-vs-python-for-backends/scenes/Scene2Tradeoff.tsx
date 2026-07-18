import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {GaugeIcon, NotebookIcon} from "../../../../../shared/components/icons";
import {LangBadge} from "../../../icons/LangBadge";
import {fadeSlideUp} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const PYTHON_TAGS = ["notebooks", "data pipelines", "quick CRUD"];
const GO_TAGS = ["predictable perf.", "static types", "concurrency at scale"];

const Column: React.FC<{
  frame: number;
  x: number;
  delay: number;
  label: string;
  accent: string;
  icon: React.ReactNode;
  tags: string[];
}> = ({frame, x, delay, label, accent, icon, tags}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: 660,
      transform: "translateX(-50%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 34,
      width: 400,
    }}
  >
    <div style={{...fadeSlideUp(frame, delay, 16)}}>{icon}</div>
    <div style={{...fadeSlideUp(frame, delay + 6, 16)}}>
      <LangBadge label={label} accent={accent} />
    </div>
    {tags.map((tag, i) => (
      <div
        key={tag}
        style={{
          ...fadeSlideUp(frame, delay + 20 + i * 12, 14),
          color: COLORS.white,
          fontFamily: FONTS.sans,
          fontSize: 26,
          fontWeight: 620,
          textAlign: "center",
        }}
      >
        {tag}
      </div>
    ))}
  </div>
);

export const Scene2Tradeoff: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <Column
        frame={frame}
        x={280}
        delay={6}
        label="Python"
        accent="#FBBF24"
        icon={<NotebookIcon size={58} />}
        tags={PYTHON_TAGS}
      />
      <Column
        frame={frame}
        x={800}
        delay={6}
        label="Go"
        accent={COLORS.cyan}
        icon={<GaugeIcon size={58} needleAngle={-40} />}
        tags={GO_TAGS}
      />

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 660,
          bottom: 480,
          width: 1,
          background: `linear-gradient(180deg, transparent, ${COLORS.border}, transparent)`,
        }}
      />

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
