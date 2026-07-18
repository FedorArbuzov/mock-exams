import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Binary, Database, Plug, Server} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const DOMAINS = [
  {label: "APIs", Icon: Server},
  {label: "databases", Icon: Database},
  {label: "protocols", Icon: Plug},
];

export const Scene4Premature: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const topIn = progress01(frame, 0, 20);
  const bottomIn = progress01(frame, 76, 96);

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
        <Panel width={940} height={780}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 140,
              transform: `translate(-50%, -50%) translateY(${(1 - topIn) * 10}px)`,
              opacity: topIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Binary size={64} color={COLORS.muted} strokeWidth={1.6} />
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 700}}>
              exotic sizes, day one
            </div>
            <div style={{color: COLORS.red, fontSize: 34, fontWeight: 800}}>✕ premature optimization</div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              top: 380,
              width: 940,
              height: 1,
              background: COLORS.border,
            }}
          />

          <div
            style={{
              position: "absolute",
              left: 0,
              top: 500,
              width: 940,
              display: "flex",
              justifyContent: "space-evenly",
              opacity: bottomIn,
              transform: `translateY(${(1 - bottomIn) * 10}px)`,
            }}
          >
            {DOMAINS.map((d) => {
              const Icon = d.Icon;
              return (
                <div
                  key={d.label}
                  style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 10}}
                >
                  <Icon size={54} color={COLORS.cyan} strokeWidth={1.6} />
                  <div style={{color: COLORS.cyan, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 700}}>
                    {d.label}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 660,
              transform: "translate(-50%, -50%)",
              opacity: bottomIn,
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <Checkmark progress={bottomIn} size={40} />
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 700}}>
              when the domain demands it
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
