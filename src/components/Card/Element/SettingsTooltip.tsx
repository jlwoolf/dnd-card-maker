import { Tooltip, ClickAwayListener, Box, type PopperProps } from "@mui/material";
import usePopperRef from "./usePopperRef";
import React from "react";

interface SettingsTooltipProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactElement;
  popperRef?: PopperProps["popperRef"];
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
  popperRef: externalPopperRef,
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
          sx: (theme) => ({
            backgroundColor: theme.palette.primary.main,
            padding: 0,
          }),
        },
        arrow: { sx: (theme) => ({ color: theme.palette.primary.main }) },
      }}
      title={
        <ClickAwayListener onClickAway={onClose}>
            <Box component="div" sx={{ display: 'flex' }}>
                {title}
            </Box>
        </ClickAwayListener>
      }
    >
      {children}
    </Tooltip>
  );
}
