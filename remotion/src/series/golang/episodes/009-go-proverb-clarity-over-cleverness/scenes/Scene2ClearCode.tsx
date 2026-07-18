import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {GoLogo} from "../../../icons/GoLogo";
import {fadeSlideUp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const TAGS = [
  {label: "clear names", dx: -160, dy: -60},
  {label: "small functions", dx: 160, dy: -60},
  {label: "explicit errors", dx: -160, dy: 60},
  {label: "composition", dx: 160, dy: 60},
];

export const Scene2ClearCode: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 700,
          transform: `translate(-50%, -50%) translateY(${(1 - fadeSlideUp(frame, 0, 16).opacity) * 20}px)`,
          opacity: fadeSlideUp(frame, 0, 16).opacity,
        }}
      >
        <GoLogo size={90} />
      </div>

      {TAGS.map((tag, i) => {
        const delay = 16 + i * 12;
        const tagIn = progress01(frame, delay, delay + 16);
        return (
          <div
            key={tag.label}
            style={{
              position: "absolute",
              left: 540 + tag.dx,
              top: 900 + tag.dy,
              transform: `translate(-50%, -50%) translateY(${(1 - tagIn) * 14}px)`,
              opacity: tagIn,
              padding: "12px 20px",
              borderRadius: 999,
              border: `1.5px solid ${COLORS.cyan}`,
              color: COLORS.cyan,
              fontFamily: FONTS.sans,
              fontSize: 21,
              fontWeight: 650,
              whiteSpace: "nowrap",
            }}
          >
            {tag.label}
          </div>
        );
      })}

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
