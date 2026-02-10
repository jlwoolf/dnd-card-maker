import { useEffect, useState, useRef } from "react";

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
        root: parentElement, // Observe relative to this element
        threshold: Array.from({ length: 101 }, (_, i) => i / 100),
        ...options,
      },
    );

    observer.observe(targetElement);

    return () => observer.disconnect();
  }, [selector, options]);

  return [targetRef, isObstructed] as const;
}
