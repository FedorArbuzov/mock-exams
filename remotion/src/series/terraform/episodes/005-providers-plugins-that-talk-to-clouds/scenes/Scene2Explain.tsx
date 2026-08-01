import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Cloud, Hexagon, Puzzle} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const PLUGINS = ["hashicorp/aws", "kubernetes", "random"] as const;

export const Scene2Explain: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const coreIn = progress01(frame, 0, 20);
  const pluginsIn = progress01(frame, 22, 44);
  const apiIn = progress01(frame, 48, 70);
  const snippetIn = progress01(frame, 72, 94);

  return (
    <AbsoluteFill>
      <div style={{position: "absolute", left: "50%", top: 780, transform: "translate(-50%, -50%)"}}>
        <Panel width={960} height={720}>
          <div
            style={{
              position: "absolute",
              left: 160,
              top: 220,
              transform: `translate(-50%, -50%) translateY(${(1 - coreIn) * 12}px)`,
              opacity: coreIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Hexagon size={64} color={COLORS.cyan} strokeWidth={1.6} />
            <div style={{color: COLORS.cyan, fontFamily: FONTS.sans, fontSize: 36, fontWeight: 750}}>
              core
            </div>
          </div>

          <div style={{position: "absolute", left: 280, top: 220, opacity: coreIn * pluginsIn}}>
            <Arrow direction="right" size={40} color={COLORS.cyan} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 480,
              top: 220,
              transform: "translate(-50%, -50%)",
              opacity: pluginsIn,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {PLUGINS.map((plugin, i) => (
              <div
                key={plugin}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 18px",
                  borderRadius: 10,
                  border: `1.5px solid ${COLORS.border}`,
                  background: "rgba(15, 23, 42, 0.55)",
                  opacity: progress01(frame, 24 + i * 8, 40 + i * 8),
                  transform: `translateY(${(1 - progress01(frame, 24 + i * 8, 40 + i * 8)) * 10}px)`,
                }}
              >
                <Puzzle size={28} color={COLORS.cyan} strokeWidth={1.6} />
                <div style={{color: COLORS.white, fontFamily: FONTS.mono, fontSize: 38, fontWeight: 700}}>
                  {plugin}
                </div>
              </div>
            ))}
          </div>

          <div style={{position: "absolute", left: 700, top: 220, opacity: pluginsIn * apiIn}}>
            <Arrow direction="right" size={40} color={COLORS.green} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 820,
              top: 220,
              transform: `translate(-50%, -50%) translateY(${(1 - apiIn) * 12}px)`,
              opacity: apiIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Cloud size={64} color={COLORS.green} strokeWidth={1.6} />
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 36, fontWeight: 750}}>
              API
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 520,
              transform: `translate(-50%, -50%) translateY(${(1 - snippetIn) * 12}px)`,
              opacity: snippetIn,
              padding: "22px 28px",
              borderRadius: 12,
              border: `1.5px solid ${COLORS.border}`,
              background: "rgba(15, 23, 42, 0.65)",
              width: 820,
            }}
          >
            <div style={{color: COLORS.cyan, fontFamily: FONTS.mono, fontSize: 38, fontWeight: 700, lineHeight: 1.5}}>
              required_providers {"{"} aws = {"{"} source = "hashicorp/aws" {"}"} {"}"}
            </div>
            <div style={{color: COLORS.white, fontFamily: FONTS.mono, fontSize: 38, fontWeight: 700, lineHeight: 1.5, marginTop: 8}}>
              provider "aws" {"{"} region = "us-east-1" {"}"}
            </div>
          </div>
        </Panel>
      </div>
      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
