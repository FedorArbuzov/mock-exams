import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {FolderIcon, XMarkGlyph} from "../../../../../shared/components/icons";
import {fadeSlideUpWith, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const TANGLE_OFFSETS = [
  {dx: -34, dy: -18, rot: -14},
  {dx: 30, dy: 6, rot: 10},
  {dx: -12, dy: 30, rot: 18},
];

export const Scene4OnePath: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const xIn = progress01(frame, durationInFrames * 0.35, durationInFrames * 0.55);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 300,
          top: 700,
          ...fadeSlideUpWith("translate(-50%, -50%)", frame, 4, 16),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <FolderIcon size={90} color={COLORS.cyan} />
        <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 680}}>
          one clean install
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 780,
          top: 700,
          transform: `translate(-50%, -50%) translateY(${(1 - progress01(frame, 10, 26)) * 20}px)`,
          opacity: progress01(frame, 10, 26),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div style={{position: "relative", width: 90, height: 90}}>
          {TANGLE_OFFSETS.map((t, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 45 + t.dx,
                top: 45 + t.dy,
                transform: `translate(-50%, -50%) rotate(${t.rot}deg)`,
                opacity: 0.75,
              }}
            >
              <FolderIcon size={70} color={COLORS.muted} />
            </div>
          ))}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              opacity: xIn,
            }}
          >
            <XMarkGlyph size={76} />
          </div>
        </div>
        <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 680}}>
          multiple installs
        </div>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
