import React from "react";

import {AbsoluteFill, useCurrentFrame} from "remotion";

import {TriangleAlert} from "lucide-react";

import {COLORS, FONTS} from "../../../../../shared/constants";

import {Caption} from "../../../../../shared/components/Caption";

import {Panel} from "../../../../../shared/components/Panel";

import {progress01} from "../../../../../shared/utils/animations";



type Props = {text: string; durationInFrames: number};



export const Scene4Edge: React.FC<Props> = ({text, durationInFrames}) => {

  const frame = useCurrentFrame();

  const chipIn = progress01(frame, 0, 24);

  const labelIn = progress01(frame, 36, 58);



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

        <Panel width={780} height={620}>

          <div

            style={{

              position: "absolute",

              left: "50%",

              top: 260,

              transform: `translate(-50%, -50%) translateY(${(1 - chipIn) * 12}px)`,

              opacity: chipIn,

              padding: "28px 36px",

              borderRadius: 14,

              border: `1.5px solid ${COLORS.border}`,

              background: "rgba(15, 23, 42, 0.55)",

              color: COLORS.muted,

              fontFamily: FONTS.mono,

              fontSize: 46,

              fontWeight: 700,

              whiteSpace: "pre",

            }}

          >

            no ` inside `

          </div>



          <div

            style={{

              position: "absolute",

              left: "50%",

              top: 460,

              transform: `translate(-50%, -50%) translateY(${(1 - labelIn) * 10}px)`,

              opacity: labelIn,

              display: "flex",

              alignItems: "center",

              gap: 14,

              color: COLORS.muted,

              fontFamily: FONTS.sans,

              fontSize: 34,

              fontWeight: 700,

            }}

          >

            <TriangleAlert size={36} color={COLORS.muted} strokeWidth={1.6} />

            rare edge case

          </div>

        </Panel>

      </div>



      <Caption text={text} durationInFrames={durationInFrames} />

    </AbsoluteFill>

  );

};

