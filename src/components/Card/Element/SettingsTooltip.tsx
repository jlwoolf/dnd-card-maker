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
            // Common radius for button groups if present, though some tooltips override this
            // We'll keep it minimal here and let children style themselves or use a common wrapper
          }),
        },
        arrow: { sx: (theme) => ({ color: theme.palette.primary.main }) },
      }}
      title={
        <ClickAwayListener onClickAway={onClose}>
            {/* The Box wrapper is common in most but not all (ButtonGroup ones don't strictly need it but it doesn't hurt) 
                However, ButtonGroup ones often had specific border radius on the tooltip.
                Let's just render the title directly but wrapped in a fragment/div to ensure ref validity if needed.
                Actually ClickAwayListener requires a single child.
            */}
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
