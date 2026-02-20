import type { PopperProps } from "@mui/material";
import { useEffect, useRef } from "react";

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
