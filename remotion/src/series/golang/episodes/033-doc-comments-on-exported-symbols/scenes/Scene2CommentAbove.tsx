import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene2CommentAbove: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const codeIn = progress01(frame, 0, 24);
  const braceIn = progress01(frame, 40, 60);
  const checkIn = progress01(frame, 70, 90);

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
        <Panel width={940} height={700}>
          <div
            style={{
              position: "absolute",
              left: 70,
              top: 130,
              opacity: codeIn,
              transform: `translateY(${(1 - codeIn) * 10}px)`,
              fontFamily: FONTS.mono,
              fontSize: 28,
              lineHeight: 1.5,
            }}
          >
            <div style={{color: COLORS.green}}>
              // <span style={{color: COLORS.cyan, fontWeight: 800}}>UserService</span> handles user
              accounts.
            </div>
            <div style={{color: COLORS.white}}>
              type <span style={{color: COLORS.cyan, fontWeight: 800}}>UserService</span> struct {"{"}
            </div>
            <div style={{color: COLORS.muted, paddingLeft: 32}}>...</div>
            <div style={{color: COLORS.white}}>{"}"}</div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 128,
              top: 190,
              width: 3,
              height: 60,
              background: COLORS.cyan,
              opacity: braceIn,
            }}
          />

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 500,
              transform: "translate(-50%, -50%)",
              opacity: checkIn,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Checkmark progress={checkIn} size={54} />
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 24, fontWeight: 750}}>
              comment name matches declared name
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
