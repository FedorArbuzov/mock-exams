import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Fingerprint, Folder} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const ROWS = [
  {label: "module", meaning: "dependency identity", Icon: Fingerprint, color: COLORS.cyan},
  {label: "package", meaning: "compile unit in a folder", Icon: Folder, color: COLORS.green},
];

export const Scene5MemoryHook: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();

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
        <Panel width={880} height={520}>
          {ROWS.map((row, i) => {
            const delay = 8 + i * 30;
            const rowIn = progress01(frame, delay, delay + 18);
            const Icon = row.Icon;
            return (
              <div
                key={row.label}
                style={{
                  position: "absolute",
                  left: 50,
                  top: 70 + i * 190,
                  width: 780,
                  display: "flex",
                  alignItems: "center",
                  gap: 30,
                  opacity: rowIn,
                  transform: `translateX(${(1 - rowIn) * -18}px)`,
                }}
              >
                <div
                  style={{
                    width: 110,
                    height: 110,
                    borderRadius: 22,
                    border: `2px solid ${row.color}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={60} color={row.color} strokeWidth={1.6} />
                </div>
                <div>
                  <div style={{color: row.color, fontFamily: FONTS.mono, fontSize: 30, fontWeight: 700}}>
                    {row.label}
                  </div>
                  <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 24, fontWeight: 650, marginTop: 6}}>
                    = {row.meaning}
                  </div>
                </div>
              </div>
            );
          })}
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
