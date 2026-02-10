import { Box } from "@mui/material";
import { Menu, type MenuProps } from "./Menu";
import { useState } from "react";
import useBottomObstructed from "./useBottomObstructed";

interface ElementProps {
  menuProps: Omit<MenuProps, "id">;
  id: string;
  children?: React.ReactNode;
}

export default function Element({
  menuProps: { visible, ...menuProps },
  id,
  children,
}: ElementProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [elementRef, isObstructed] = useBottomObstructed(
    "#base-card-paper-container",
  );

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
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      <Menu
        id={id}
        visible={isHovered || visible}
        obstructed={isObstructed}
        {...menuProps}
      />
    </Box>
  );
}
