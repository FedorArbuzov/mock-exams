import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Layers, Zap} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene3NotLinter: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 18);
  const rightIn = progress01(frame, 14, 32);
  const localIn = progress01(frame, 44, 60);
  const ciIn = progress01(frame, 56, 72);

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
        <Panel width={880} height={680}>
          <div
            style={{
              position: "absolute",
              left: 220,
              top: 190,
              transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 14}px)`,
              opacity: leftIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Zap size={96} color={COLORS.green} strokeWidth={1.6} />
            <div style={{color: COLORS.green, fontFamily: FONTS.mono, fontSize: 26, fontWeight: 700}}>
              go vet
            </div>
            <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 18, fontWeight: 600, textAlign: "center", maxWidth: 220}}>
              fast baseline
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 660,
              top: 190,
              transform: `translate(-50%, -50%) translateY(${(1 - rightIn) * 14}px)`,
              opacity: rightIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Layers size={96} color={COLORS.muted} strokeWidth={1.6} />
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 26, fontWeight: 700}}>
              full linter
            </div>
            <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 18, fontWeight: 600, textAlign: "center", maxWidth: 220}}>
              deep, slower
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              top: 450,
              width: 880,
              display: "flex",
              justifyContent: "space-evenly",
            }}
          >
            <div style={{display: "flex", alignItems: "center", gap: 14, opacity: localIn}}>
              <Checkmark progress={localIn} size={54} />
              <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 700}}>
                run locally
              </div>
            </div>
            <div style={{display: "flex", alignItems: "center", gap: 14, opacity: ciIn}}>
              <Checkmark progress={ciIn} size={54} />
              <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 700}}>
                run in CI
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
