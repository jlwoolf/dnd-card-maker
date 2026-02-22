import { useEffect, useRef } from "react";
import type { PopperProps } from "@mui/material";

/**
 * usePopperRef creates a specialized reference for MUI Poppers that updates 
 * on every animation frame. This ensures that floating menus stay pixel-perfectly 
 * aligned even when the anchor element is moving due to CSS transitions, 
 * layout shifts, or drag-and-drop operations.
 *
 * @returns A mutable ref object suitable for the MUI Popper `popperRef` prop.
 */
export default function usePopperRef() {
  const popperRef: PopperProps["popperRef"] = useRef(null);

  useEffect(() => {
    let handle: number;

    const loop = () => {
      // Manually trigger a position update on the Popper instance
      popperRef.current?.update();
      handle = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(handle);
    };
  }, []);

  return popperRef;
}
