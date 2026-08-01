import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {GitPullRequest, Network} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const SNIPPET_LINES = [
  'resource "aws_s3_bucket" "logs" {',
  '  bucket = "app-logs"',
  "}",
] as const;

export const Scene3Snippet: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const codeIn = progress01(frame, 0, 24);
  const prIn = progress01(frame, 28, 50);
  const graphIn = progress01(frame, 54, 76);

  return (
    <AbsoluteFill>
      <div style={{position: "absolute", left: "50%", top: 780, transform: "translate(-50%, -50%)"}}>
        <Panel width={960} height={720}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 260,
              transform: `translate(-50%, -50%) translateY(${(1 - codeIn) * 14}px)`,
              opacity: codeIn,
              padding: "28px 32px",
              borderRadius: 14,
              border: `1.5px solid ${COLORS.border}`,
              background: "rgba(15, 23, 42, 0.65)",
              width: 820,
            }}
          >
            {SNIPPET_LINES.map((line) => (
              <div
                key={line}
                style={{
                  color: line.startsWith("resource") ? COLORS.cyan : COLORS.white,
                  fontFamily: FONTS.mono,
                  fontSize: 44,
                  fontWeight: 700,
                  lineHeight: 1.55,
                }}
              >
                {line}
              </div>
            ))}
          </div>

          <div
            style={{
              position: "absolute",
              left: 280,
              top: 520,
              transform: "translate(-50%, -50%)",
              opacity: prIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <GitPullRequest size={52} color={COLORS.green} strokeWidth={1.6} />
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 36, fontWeight: 750}}>
              PR readable
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 680,
              top: 520,
              transform: "translate(-50%, -50%)",
              opacity: graphIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Network size={52} color={COLORS.cyan} strokeWidth={1.6} />
            <div style={{color: COLORS.cyan, fontFamily: FONTS.sans, fontSize: 36, fontWeight: 750}}>
              graph parse
            </div>
          </div>
        </Panel>
      </div>
      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
