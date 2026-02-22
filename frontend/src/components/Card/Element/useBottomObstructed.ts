import { useEffect, useRef, useState } from "react";

/**
 * useBottomObstructed utilizes the IntersectionObserver API to detect if an 
 * element's bottom edge is currently clipped or hidden by a scrollable parent.
 * This is primarily used to determine if floating menus should flip their 
 * orientation to remain visible.
 *
 * @param selector - The CSS selector of the scrollable container to check against.
 * @param options - Standard IntersectionObserver options.
 * @returns A tuple containing the React ref to attach to the target element 
 *          and a boolean indicating if the bottom is obstructed.
 */
export default function useBottomObstructed(selector: string, options = {}) {
  const [isObstructed, setIsObstructed] = useState(false);
  const targetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const targetElement = targetRef.current;
    if (!targetElement) return;

    const parentElement = targetElement.closest(selector);
    if (!parentElement) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const { rootBounds, boundingClientRect, intersectionRatio } = entry;
        if (!rootBounds) return;

        const isClipped = intersectionRatio < 1;
        const isBelowBottom = boundingClientRect.bottom > rootBounds.bottom;
        setIsObstructed(isBelowBottom || (isClipped && isBelowBottom));
      },
      {
        root: parentElement,
        // High granularity threshold to catch subtle clipping
        threshold: Array.from({ length: 101 }, (_, i) => i / 100),
        ...options,
      },
    );

    observer.observe(targetElement);

    return () => observer.disconnect();
  }, [selector, options]);

  return [targetRef, isObstructed] as const;
}
