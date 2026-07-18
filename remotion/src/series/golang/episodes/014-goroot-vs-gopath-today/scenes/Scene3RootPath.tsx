import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {DownloadIcon, GearIcon} from "../../../../../shared/components/icons";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene3RootPath: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 4, 20);
  const rightIn = progress01(frame, 22, 38);
  const spin = frame * 0.6;

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 300,
          top: 720,
          transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 16}px)`,
          opacity: leftIn,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
        }}
      >
        <div style={{color: COLORS.cyan, fontFamily: FONTS.mono, fontSize: 26, fontWeight: 700}}>
          GOROOT
        </div>
        <div style={{transform: `rotate(${spin}deg)`}}>
          <GearIcon size={90} color={COLORS.cyan} />
        </div>
        <div
          style={{
            color: COLORS.muted,
            fontFamily: FONTS.sans,
            fontSize: 20,
            fontWeight: 620,
            textAlign: "center",
            maxWidth: 260,
          }}
        >
          the toolchain itself — you rarely touch it
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 780,
          top: 720,
          transform: `translate(-50%, -50%) translateY(${(1 - rightIn) * 16}px)`,
          opacity: rightIn,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
        }}
      >
        <div style={{color: COLORS.green, fontFamily: FONTS.mono, fontSize: 26, fontWeight: 700}}>
          GOPATH
        </div>
        <DownloadIcon size={90} color={COLORS.green} />
        <div
          style={{
            color: COLORS.muted,
            fontFamily: FONTS.sans,
            fontSize: 20,
            fontWeight: 620,
            textAlign: "center",
            maxWidth: 260,
          }}
        >
          cache where modules download to
        </div>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
