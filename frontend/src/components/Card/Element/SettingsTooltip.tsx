import React from "react";
import {
  Box,
  ClickAwayListener,
  Tooltip,
  type PopperProps,
  type SxProps,
  type Theme,
} from "@mui/material";
import { mergeSx } from "@src/utils/mergeSx";
import usePopperRef from "./usePopperRef";

interface SettingsTooltipProps {
  /** Whether the tooltip is currently open */
  open: boolean;
  /** Callback to close the tooltip */
  onClose: () => void;
  /** Content to display inside the tooltip (usually an input or slider) */
  title: React.ReactNode;
  /** The element that triggers the tooltip */
  children: React.ReactElement;
  /** Optional custom Popper ref for manual position management */
  popperRef?: PopperProps["popperRef"];
  /** 
   * Visual variant of the tooltip. 
   * "toolbar" is grey/dark (for top bar), "menu" is primary (for inline popups).
   */
  variant?: "menu" | "toolbar";
  /** Optional custom styles for nested tooltip parts */
  sx?: {
    tooltip?: SxProps<Theme>;
    arrow?: SxProps<Theme>;
  };
}

/**
 * SettingsTooltip is a specialized MUI Tooltip wrapper designed for complex 
 * element configuration. It handles automatic positioning updates and provides 
 * consistent visual themes for both global toolbar and inline element menus.
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
      slotProps={{
        popper: {
          popperRef,
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
              "& .MuiButtonBase-root": {
                backgroundColor:
                  variant === "toolbar" ? "grey.300" : "primary.main",

                "&.toggled": {
                  backgroundColor:
                    variant === "toolbar" ? "grey.400" : "primary.dark",
                  boxShadow: "inset 0px 2px 4px rgba(0, 0, 0, 0.2)",

                  ".MuiSvgIcon-root": {
                    color: variant === "toolbar" ? "grey.800" : "white",
                  },
                },
              },
            }),
            sx?.tooltip,
          ),
        },
        arrow: {
          sx: mergeSx(
            {
              color: variant === "toolbar" ? "grey.300" : "primary.main",
            },
            sx?.arrow,
          ),
        },
      }}
      title={
        <ClickAwayListener onClickAway={onClose} mouseEvent="onMouseDown">
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
