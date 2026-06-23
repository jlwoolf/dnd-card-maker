import { useEffect, useRef, useState } from "react";

interface ResponsiveZoom {
  zoom: number;
  isColumn: boolean;
}

/**
 * Calculates a zoom factor for the card editor based on available viewport height.
 * Cards render at 400px internally (for correct text/image sizing) and are visually
 * scaled via CSS zoom. When the window height is too small for the minimum zoom,
 * the layout switches to column mode (stacked + scrollable).
 *
 * Resize events are debounced (200ms) to avoid oscillating zoom on mobile browsers
 * where the address bar collapses during scroll, changing innerHeight repeatedly.
 */
export function useResponsiveZoom(): ResponsiveZoom {
  const [state, setState] = useState<ResponsiveZoom>({ zoom: 0.85, isColumn: false });
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    function calc() {
      const availableH = window.innerHeight - 48 - 40;
      const requiredH = 640;
      const raw = availableH / requiredH;

      const next: ResponsiveZoom =
        raw <= 0.65
          ? { zoom: 0.65, isColumn: true }
          : { zoom: Math.min(1, raw), isColumn: false };

      setState((prev) => {
        if (prev.zoom === next.zoom && prev.isColumn === next.isColumn) return prev;
        return next;
      });
    }

    function debouncedCalc() {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(calc, 200);
    }

    calc();
    window.addEventListener("resize", debouncedCalc);
    return () => {
      window.removeEventListener("resize", debouncedCalc);
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  return state;
}
