import { useEffect, useState, useRef } from "react";

/**
 * useBottomObstructed detects if an element's bottom edge is outside the visible area
 * of a parent container matched by the provided selector.
 *
 * @param selector - CSS selector of the scrollable parent container.
 * @param options - IntersectionObserver options.
 * @returns A tuple containing the ref to attach and a boolean indicating if the element is obstructed.
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
        threshold: Array.from({ length: 101 }, (_, i) => i / 100),
        ...options,
      },
    );

    observer.observe(targetElement);

    return () => observer.disconnect();
  }, [selector, options]);

  return [targetRef, isObstructed] as const;
}
