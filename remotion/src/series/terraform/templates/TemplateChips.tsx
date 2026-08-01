import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../shared/constants";
import {Caption} from "../../../shared/components/Caption";
import {Panel} from "../../../shared/components/Panel";
import {progress01} from "../../../shared/utils/animations";

type Props = {
  text: string;
  durationInFrames: number;
  chips: string[];
};

/** Scene 2: staggered chip/tile row. */
export const TemplateChips: React.FC<Props> = ({text, durationInFrames, chips}) => {
  const frame = useCurrentFrame();
  const items = chips.slice(0, 5);

  return (
    <AbsoluteFill>
      <div style={{position: "absolute", left: "50%", top: 780, transform: "translate(-50%, -50%)"}}>
        <Panel width={960} height={720}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 28,
              padding: 48,
            }}
          >
            {items.map((chip, i) => {
              const t = progress01(frame, 8 + i * 14, 28 + i * 14);
              return (
                <div
                  key={chip}
                  style={{
                    opacity: t,
                    transform: `translateY(${(1 - t) * 18}px)`,
                    width: "88%",
                    padding: "22px 28px",
                    borderRadius: 16,
                    border: `1.5px solid ${COLORS.cyan}88`,
                    background: "rgba(15, 23, 42, 0.65)",
                    boxShadow: `0 0 18px ${COLORS.glowCyan}`,
                    color: COLORS.white,
                    fontFamily: FONTS.sans,
                    fontSize: 40,
                    fontWeight: 740,
                    textAlign: "center",
                  }}
                >
                  {chip}
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
