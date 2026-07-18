import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {Cluster} from "../../../icons/Cluster";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const RULES = ["node = capacity", "cluster = orchestration"] as const;

export const Scene5Rule: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const clusterIn = progress01(frame, 0, 28);

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
        <Panel width={920} height={620}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 160,
              transform: "translate(-50%, -50%)",
              opacity: clusterIn,
            }}
          >
            <Cluster
              title="check both"
              pods={[
                {id: "1", label: "pod", status: "healthy"},
                {id: "2", label: "pod", status: "pending"},
              ]}
              style={{width: 780}}
            />
          </div>

          {RULES.map((rule, i) => {
            const stepIn = progress01(frame, 32 + i * 32, 54 + i * 32);
            return (
              <div
                key={rule}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: 380 + i * 100,
                  width: 780,
                  transform: `translate(-50%, -50%) translateY(${(1 - stepIn) * 12}px)`,
                  opacity: stepIn,
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                  padding: "18px 26px",
                  borderRadius: 14,
                  border: `1.5px solid ${COLORS.cyan}`,
                  background: "rgba(15, 23, 42, 0.55)",
                }}
              >
                <Checkmark progress={stepIn} size={44} />
                <div style={{color: COLORS.cyan, fontFamily: FONTS.mono, fontSize: 42, fontWeight: 750}}>
                  {rule}
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
