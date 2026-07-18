import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {FolderLock, Globe} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene5UseCase: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const questionIn = progress01(frame, 0, 20);
  const noIn = progress01(frame, 30, 50);
  const yesIn = progress01(frame, 30, 50);

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
        <Panel width={860} height={680}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 90,
              transform: "translate(-50%, -50%)",
              opacity: questionIn,
              color: COLORS.white,
              fontFamily: FONTS.sans,
              fontSize: 26,
              fontWeight: 700,
              textAlign: "center",
              width: 700,
            }}
          >
            is this a supported public API?
          </div>

          <div
            style={{
              position: "absolute",
              left: 240,
              top: 340,
              transform: `translate(-50%, -50%) translateY(${(1 - noIn) * 14}px)`,
              opacity: noIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div style={{color: COLORS.red, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 700}}>
              no
            </div>
            <FolderLock size={80} color={COLORS.cyan} strokeWidth={1.6} />
            <div style={{color: COLORS.cyan, fontFamily: FONTS.mono, fontSize: 22, fontWeight: 700}}>
              internal
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 620,
              top: 340,
              transform: `translate(-50%, -50%) translateY(${(1 - yesIn) * 14}px)`,
              opacity: yesIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 700}}>
              yes
            </div>
            <Globe size={80} color={COLORS.green} strokeWidth={1.6} />
            <div style={{color: COLORS.green, fontFamily: FONTS.mono, fontSize: 22, fontWeight: 700}}>
              public package
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
