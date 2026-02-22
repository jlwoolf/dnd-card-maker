import React from "react";
import { SvgIcon, type SvgIconProps } from "@mui/material";

/**
 * BannerIcon is a custom SVG icon representing a banner shape.
 */
const BannerIcon: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon
      {...props}
      viewBox="0 0 52.916669 52.916675"
      sx={{
        width: "auto",
        height: "1em",
        ...props.sx,
      }}
    >
      <g transform="translate(-140.51545,-46.924022)">
        <path
          style={{
            fill: "none",
            fillOpacity: 1,
            stroke: "currentColor",
            strokeWidth: 3,
            strokeDasharray: "none",
            strokeOpacity: 1,
          }}
          d="m 151.24617,61.399624 c 0,0 -4.41138,0.626281 -4.44934,11.858708 -0.038,11.232426 4.44934,12.106755 4.44934,12.106755 h 31.45471 c 0,0 4.48786,-0.874329 4.44986,-12.106755 -0.038,-11.232426 -4.44986,-11.858708 -4.44986,-11.858708 z"
        />
      </g>
    </SvgIcon>
  );
};

export default BannerIcon;
