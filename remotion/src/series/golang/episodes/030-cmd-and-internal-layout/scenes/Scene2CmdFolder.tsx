import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Folder, FolderLock, Globe, Server, Timer, Wrench} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const BINARIES = [
  {label: "api", Icon: Server},
  {label: "worker", Icon: Timer},
  {label: "migrate", Icon: Wrench},
];

export const Scene2CmdFolder: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const cmdIn = progress01(frame, 0, 18);
  const internalIn = progress01(frame, 70, 90);
  const publicIn = progress01(frame, 90, 108);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 800,
          transform: "translate(-50%, -50%)",
        }}
      >
        <Panel width={900} height={880}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 100,
              transform: `translate(-50%, -50%) translateY(${(1 - cmdIn) * 12}px)`,
              opacity: cmdIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <Folder size={70} color={COLORS.cyan} strokeWidth={1.6} />
            <div style={{color: COLORS.cyan, fontFamily: FONTS.mono, fontSize: 26, fontWeight: 700}}>
              cmd
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              top: 260,
              width: 900,
              display: "flex",
              justifyContent: "space-evenly",
            }}
          >
            {BINARIES.map((b, i) => {
              const delay = 20 + i * 16;
              const bIn = progress01(frame, delay, delay + 16);
              const Icon = b.Icon;
              return (
                <div
                  key={b.label}
                  style={{
                    opacity: bIn,
                    transform: `translateY(${(1 - bIn) * 12}px)`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Icon size={56} color={COLORS.white} strokeWidth={1.6} />
                  <div style={{color: COLORS.white, fontFamily: FONTS.mono, fontSize: 20, fontWeight: 650}}>
                    {b.label}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              position: "absolute",
              left: 250,
              top: 560,
              transform: `translate(-50%, -50%) translateY(${(1 - internalIn) * 12}px)`,
              opacity: internalIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <FolderLock size={68} color={COLORS.muted} strokeWidth={1.6} />
            <div style={{color: COLORS.muted, fontFamily: FONTS.mono, fontSize: 22, fontWeight: 650}}>
              internal
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 650,
              top: 560,
              transform: `translate(-50%, -50%) translateY(${(1 - publicIn) * 12}px)`,
              opacity: publicIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Globe size={68} color={COLORS.green} strokeWidth={1.6} />
            <div style={{color: COLORS.green, fontFamily: FONTS.mono, fontSize: 22, fontWeight: 650}}>
              public / pkg
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
