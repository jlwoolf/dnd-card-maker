import React from "react";
import { Paper, type PaperProps } from "@mui/material";
import classNames from "classnames";
import { mergeSx } from "@src/utils/mergeSx";

/**
 * CardMenu is a specialized Paper container used for card toolbars and menus.
 * It includes logic to handle border rounding when placed adjacent to a BaseCard.
 */
const CardMenu = React.forwardRef<HTMLDivElement, Omit<PaperProps, "ref">>(
  ({ children, sx, className, ...props }, ref) => {
    return (
      <Paper
        ref={ref}
        className={classNames(className, "card-menu")}
        sx={mergeSx(
          (theme) => ({
            "&:has(+ .base-card)": {
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
            },

            ".base-card + &": {
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
            },

            minHeight: "40px",
            width: "100%",
            backgroundColor: theme.palette.grey[300],
          }),
          sx,
        )}
        {...props}
      >
        {children}
      </Paper>
    );
  },
);

CardMenu.displayName = "CardMenu";

export default CardMenu;
