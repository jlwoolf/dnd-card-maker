import {
  Tooltip,
  ClickAwayListener,
  Box,
  type PopperProps,
  type SxProps,
  type Theme,
} from "@mui/material";
import usePopperRef from "./usePopperRef";
import React from "react";
import { mergeSx } from "@src/utils/mergeSx";

interface SettingsTooltipProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactElement;
  popperRef?: PopperProps["popperRef"];
  variant?: "menu" | "toolbar";
  sx?: {
    tooltip?: SxProps<Theme>;
    arrow?: SxProps<Theme>;
  };
}

/**
 * A standardized Tooltip component for Element settings.
 * Handles the Popper reference, ClickAwayListener, and common styling.
 */
export default function SettingsTooltip({
  open,
  onClose,
  title,
  children,
  sx,
  popperRef: externalPopperRef,
  variant = "toolbar",
}: SettingsTooltipProps) {
  const internalPopperRef = usePopperRef();
  const popperRef = externalPopperRef || internalPopperRef;

  return (
    <Tooltip
      open={open}
      arrow
      placement="bottom"
      slotProps={{
        popper: {
          popperRef,
          disablePortal: true,
          modifiers: [{ name: "offset", options: { offset: [0, -8] } }],
        },
        tooltip: {
          sx: mergeSx(
            (theme) => ({
              boxShadow: theme.shadows[4],
              borderRadius: theme.spacing(0.5),
              backgroundColor:
                variant === "toolbar" ? "grey.300" : "primary.main",
              color: variant === "toolbar" ? "grey.700" : "text.primary",
              ".MuiDivider-root": {
                backgroundColor: "grey.700",
              },
              ".MuiSvgIcon-root": {
                color: variant === "toolbar" ? "grey.700" : "white",
              },
              ".MuiInputBase-root": {
                color: "grey.700",

                "&:before": {
                  borderBottomColor: "grey.700",
                },

                "&:hover:not(.Mui-disabled):before": {
                  borderBottomColor: "grey.800",
                },
                "&:after": {
                  borderBottomColor: "primary.main",
                },
              },

              ".MuiSlider-root": {
                color: "grey.700",
              },
              "& .MuiSlider-valueLabel": {
                backgroundColor: "grey.700",
              },
            }),
            sx?.tooltip,
          ),
        },
        arrow: {
          sx: mergeSx(
            {
              color: "primary.main",
              ".card-menu &": {
                color: "grey.300",
              },
            },
            sx?.arrow,
          ),
        },
      }}
      title={
        <ClickAwayListener onClickAway={onClose}>
          <Box component="div" sx={{ display: "flex" }}>
            {title}
          </Box>
        </ClickAwayListener>
      }
    >
      {children}
    </Tooltip>
  );
}
