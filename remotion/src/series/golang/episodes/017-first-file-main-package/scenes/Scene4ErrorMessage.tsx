import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {FileX2, FolderX} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {clamp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const LINES = ["$ go build .", "package main: cannot find", "package main in directory"];
const FULL_LEN = LINES.join("\n").length;

const CAUSES = [
  {label: "wrong directory", Icon: FolderX},
  {label: "missing func main", Icon: FileX2},
];

export const Scene4ErrorMessage: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const typeEnd = Math.floor(durationInFrames * 0.4);
  const typedChars = Math.round(interpolate(frame, [4, typeEnd], [0, FULL_LEN], clamp));

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 750,
          transform: "translate(-50%, -50%)",
        }}
      >
        <Panel width={880} height={660}>
          <div
            style={{
              position: "absolute",
              left: 40,
              top: 40,
              width: 800,
              borderRadius: 18,
              border: `1.5px solid ${COLORS.red}66`,
              background: "rgba(7,12,24,0.9)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                padding: "12px 18px",
                borderBottom: `1px solid ${COLORS.border}`,
              }}
            >
              {["#F87171", "#FBBF24", "#34D399"].map((c) => (
                <div key={c} style={{width: 11, height: 11, borderRadius: 99, background: c}} />
              ))}
            </div>
            <pre
              style={{
                margin: 0,
                padding: "26px 30px",
                color: COLORS.red,
                fontFamily: FONTS.mono,
                fontSize: 26,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
              }}
            >
              {LINES.join("\n").slice(0, typedChars)}
              <span style={{opacity: typedChars < FULL_LEN ? 1 : 0}}>|</span>
            </pre>
          </div>

          {CAUSES.map((cause, i) => {
            const delay = typeEnd + 10 + i * 20;
            const nodeIn = progress01(frame, delay, delay + 16);
            const Icon = cause.Icon;
            return (
              <div
                key={cause.label}
                style={{
                  position: "absolute",
                  left: 220 + i * 440,
                  top: 460,
                  transform: `translate(-50%, -50%) translateY(${(1 - nodeIn) * 16}px)`,
                  opacity: nodeIn,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <Icon size={90} color={COLORS.red} strokeWidth={1.5} />
                <div
                  style={{
                    color: COLORS.white,
                    fontFamily: FONTS.sans,
                    fontSize: 24,
                    fontWeight: 700,
                    textAlign: "center",
                  }}
                >
                  {cause.label}
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
