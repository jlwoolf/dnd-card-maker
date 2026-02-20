import { Box, type BoxProps } from "@mui/material";
import { Menu, type MenuProps } from "./Menu";
import { useState } from "react";
import useBottomObstructed from "./useBottomObstructed";
import classNames from "classnames";

interface ElementProps extends BoxProps {
  menuProps: Omit<MenuProps, "id">;
  id: string;
}

export default function Element({
  menuProps: { visible, ...menuProps },
  id,
  children,
  ...rest
}: ElementProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [elementRef] = useBottomObstructed("#base-card-paper-container");

  return (
    <Box
      ref={elementRef}
      position="relative"
      display="inline-block"
      sx={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",

        "&.hovered:has(img)": {
          img: {
            outlineWidth: "2px",
            outlineOffset: "-2px",
            outlineColor: "primary.main",
            outlineStyle: "solid",
            cursor: "pointer",
            transition: "none",
          },
        },
      }}
      className={classNames({ hovered: isHovered })}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...rest}
    >
      {children}
      <Menu
        id={id}
        visible={isHovered || visible}
        // obstructed={isObstructed}
        {...menuProps}
      />
    </Box>
  );
}
