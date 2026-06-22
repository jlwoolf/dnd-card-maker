import { useEffect, useState } from "react";

interface ResponsiveZoom {
  zoom: number;
  isColumn: boolean;
}

/**
 * Calculates a zoom factor for the card editor based on available viewport height.
 * Cards render at 400px internally (for correct text/image sizing) and are visually
 * scaled via CSS zoom. When the window height is too small for the minimum zoom,
 * the layout switches to column mode (stacked + scrollable).
 */
export function useResponsiveZoom(): ResponsiveZoom {
  const [state, setState] = useState<ResponsiveZoom>({ zoom: 0.85, isColumn: false });

  useEffect(() => {
    function calc() {
      const availableH = window.innerHeight - 48 - 40;
      const requiredH = 640;
      const raw = availableH / requiredH;

      if (raw <= 0.65) {
        setState({ zoom: 0.65, isColumn: true });
      } else {
        setState({ zoom: Math.min(1, raw), isColumn: false });
      }
    }
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  return state;
}
