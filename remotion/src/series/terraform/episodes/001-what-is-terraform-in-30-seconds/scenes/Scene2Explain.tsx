import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Cloud, Plug} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Panel} from "../../../../../shared/components/Panel";
import {TfFile} from "../../../icons/TfFile";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene2Explain: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 22);
  const midIn = progress01(frame, 24, 44);
  const rightIn = progress01(frame, 48, 72);

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
        <Panel width={960} height={720}>
          <div
            style={{
              position: "absolute",
              left: 180,
              top: 300,
              transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 12}px)`,
              opacity: leftIn,
            }}
          >
            <TfFile size={240} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 420,
              top: 280,
              opacity: midIn,
            }}
          >
            <Arrow direction="right" size={44} color={COLORS.cyan} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 520,
              top: 300,
              transform: `translate(-50%, -50%) translateY(${(1 - midIn) * 12}px)`,
              opacity: midIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Plug size={64} color={COLORS.cyan} strokeWidth={1.6} />
            <div
              style={{
                color: COLORS.cyan,
                fontFamily: FONTS.sans,
                fontSize: 38,
                fontWeight: 750,
              }}
            >
              provider
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 680,
              top: 280,
              opacity: midIn * rightIn,
            }}
          >
            <Arrow direction="right" size={44} color={COLORS.green} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 780,
              top: 300,
              transform: `translate(-50%, -50%) translateY(${(1 - rightIn) * 12}px)`,
              opacity: rightIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Cloud size={64} color={COLORS.green} strokeWidth={1.6} />
            <div
              style={{
                color: COLORS.green,
                fontFamily: FONTS.sans,
                fontSize: 38,
                fontWeight: 750,
              }}
            >
              API
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 520,
              transform: "translate(-50%, -50%)",
              opacity: rightIn,
              color: COLORS.muted,
              fontFamily: FONTS.mono,
              fontSize: 38,
              fontWeight: 700,
            }}
          >
            AWS · K8s · GitHub
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
