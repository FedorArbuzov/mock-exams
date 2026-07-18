import React from "react";

import {AbsoluteFill, useCurrentFrame} from "remotion";

import {COLORS, FONTS} from "../../../../../shared/constants";

import {Caption} from "../../../../../shared/components/Caption";

import {Panel} from "../../../../../shared/components/Panel";

import {progress01} from "../../../../../shared/utils/animations";



type Props = {text: string; durationInFrames: number};



const LINES = [

  {code: "path := `C:\\Users\\go`", color: COLORS.cyan},

  {code: "re := `^[a-z]+$`", color: COLORS.cyan},

];



export const Scene2Raw: React.FC<Props> = ({text, durationInFrames}) => {

  const frame = useCurrentFrame();

  const labelIn = progress01(frame, 90, 110);



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

          {LINES.map((line, i) => {

            const lineIn = progress01(frame, 8 + i * 14, 26 + i * 14);

            return (

              <div

                key={line.code}

                style={{

                  position: "absolute",

                  left: 56,

                  top: 260 + i * 100,

                  opacity: lineIn,

                  transform: `translateY(${(1 - lineIn) * 10}px)`,

                  color: line.color,

                  fontFamily: FONTS.mono,

                  fontSize: 42,

                  fontWeight: 700,

                  whiteSpace: "pre",

                  textShadow: `0 0 14px ${COLORS.glowCyan}`,

                }}

              >

                {line.code}

              </div>

            );

          })}



          <div

            style={{

              position: "absolute",

              left: "50%",

              top: 680,

              transform: "translate(-50%, -50%)",

              opacity: labelIn,

              color: COLORS.cyan,

              fontFamily: FONTS.sans,

              fontSize: 34,

              fontWeight: 750,

            }}

          >

            backticks

          </div>

        </Panel>

      </div>



      <Caption text={text} durationInFrames={durationInFrames} />

    </AbsoluteFill>

  );

};

