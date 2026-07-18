import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Folder, Package} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene2Mechanism: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const codeIn = progress01(frame, 0, 22);
  const leftIn = progress01(frame, 34, 54);
  const rightIn = progress01(frame, 48, 68);

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
        <Panel width={960} height={780}>
          <div
            style={{
              position: "absolute",
              left: 60,
              top: 100,
              opacity: codeIn,
              transform: `translateY(${(1 - codeIn) * 10}px)`,
              color: COLORS.white,
              fontFamily: FONTS.mono,
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            replace example.com/lib =&gt; ../lib
          </div>

          <div
            style={{
              position: "absolute",
              left: 250,
              top: 400,
              transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 12}px)`,
              opacity: leftIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <Package size={80} color={COLORS.muted} strokeWidth={1.6} />
            <div
              style={{
                color: COLORS.muted,
                fontFamily: FONTS.sans,
                fontSize: 20,
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              cached remote
              <br />
              version
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 400,
              transform: "translate(-50%, -50%)",
              opacity: (leftIn + rightIn) / 2,
            }}
          >
            <Arrow direction="right" size={50} color={COLORS.cyan} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 700,
              top: 400,
              transform: `translate(-50%, -50%) translateY(${(1 - rightIn) * 12}px)`,
              opacity: rightIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <Folder size={80} color={COLORS.cyan} strokeWidth={1.6} />
            <div style={{color: COLORS.cyan, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 700}}>
              local checkout
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
