import { useState } from "react";
import { Box, type BoxProps } from "@mui/material";
import classNames from "classnames";
import { Menu, type MenuProps } from "./Menu";
import useBottomObstructed from "./useBottomObstructed";

interface ElementProps extends BoxProps {
  /** Props for the floating action menu */
  menuProps: Omit<MenuProps, "id">;
  /** Unique identifier for the element */
  id: string;
}

/**
 * Element is a polymorphic wrapper for card items (Text/Image).
 * It manages hover states, intersection-based visibility for menus, 
 * and renders the floating Action Menu for each element.
 */
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
      data-testid={`card-element-${id}`}
      aria-label={`Card element ${id}`}
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
      <Menu id={id} visible={isHovered || visible} {...menuProps} />
    </Box>
  );
}
