import { useEffect, useRef } from "react";
import type { PopperProps } from "@mui/material";

/**
 * usePopperRef creates a ref for MUI Popper and starts an animation loop to
 * manually update the Popper position on every frame. This is useful for
 * ensuring the Popper stays attached to moving or transitioning elements.
 *
 * @returns A ref object for use with the `popperRef` prop.
 */
export default function usePopperRef() {
  const popperRef: PopperProps["popperRef"] = useRef(null);

  useEffect(() => {
    let handle: number;

    const loop = () => {
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
