import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Database, FileCode, Folder, FolderLock} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const ROWS = [
  {indent: 0, Icon: Folder, label: "cmd/", color: COLORS.cyan},
  {indent: 1, Icon: FileCode, label: "myapp — main", color: COLORS.white},
  {indent: 0, Icon: FolderLock, label: "internal/", color: COLORS.cyan},
  {indent: 1, Icon: Database, label: "db — private", color: COLORS.white},
  {indent: 0, Icon: Folder, label: "api — public", color: COLORS.green},
];

export const Scene4Layout: React.FC<Props> = ({text, durationInFrames}) => {
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
        <Panel width={800} height={760}>
          <div
            style={{
              position: "absolute",
              left: 50,
              top: 60,
              width: 700,
              borderRadius: 18,
              border: `1.5px solid ${COLORS.border}`,
              background: "rgba(7,12,24,0.9)",
              padding: "16px 0",
            }}
          >
            {ROWS.map((row, i) => {
              const delay = 8 + i * 18;
              const rowIn = progress01(frame, delay, delay + 14);
              const Icon = row.Icon;
              return (
                <div
                  key={row.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "14px 28px",
                    paddingLeft: 28 + row.indent * 50,
                    opacity: rowIn,
                    transform: `translateX(${(1 - rowIn) * -14}px)`,
                  }}
                >
                  <Icon size={row.indent === 0 ? 38 : 32} color={row.color} strokeWidth={1.7} />
                  <div
                    style={{
                      color: row.color,
                      fontFamily: FONTS.mono,
                      fontSize: row.indent === 0 ? 26 : 22,
                      fontWeight: row.indent === 0 ? 700 : 600,
                    }}
                  >
                    {row.label}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
