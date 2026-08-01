import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../shared/constants";
import {Caption} from "../../../shared/components/Caption";
import {Panel} from "../../../shared/components/Panel";
import {progress01} from "../../../shared/utils/animations";

type Props = {
  text: string;
  durationInFrames: number;
  lines: string[];
};

/** Scene 3: large mono CLI/HCL panel. */
export const TemplateCode: React.FC<Props> = ({text, durationInFrames, lines}) => {
  const frame = useCurrentFrame();
  const panelIn = progress01(frame, 0, 22);
  const shown = lines.slice(0, 6);

  return (
    <AbsoluteFill>
      <div style={{position: "absolute", left: "50%", top: 780, transform: "translate(-50%, -50%)"}}>
        <Panel width={960} height={720}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 860,
              transform: `translate(-50%, -50%) translateY(${(1 - panelIn) * 14}px)`,
              opacity: panelIn,
              padding: "36px 40px",
              borderRadius: 16,
              border: `1.5px solid ${COLORS.border}`,
              background: "rgba(7, 12, 24, 0.92)",
            }}
          >
            {shown.map((line, i) => {
              const t = progress01(frame, 16 + i * 10, 34 + i * 10);
              return (
                <div
                  key={`${i}-${line}`}
                  style={{
                    opacity: t,
                    color: line.startsWith("#") || line.startsWith("//") ? COLORS.muted : COLORS.cyan,
                    fontFamily: FONTS.mono,
                    fontSize: shown.some((l) => l.length > 36) ? 34 : 42,
                    fontWeight: 700,
                    lineHeight: 1.55,
                    marginBottom: 10,
                  }}
                >
                  {line}
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
