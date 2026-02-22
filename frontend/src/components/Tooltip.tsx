import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

interface TooltipProps {
  /** The element that triggers the tooltip on hover */
  children: React.ReactElement<{
    onMouseEnter?: React.MouseEventHandler;
    onMouseLeave?: React.MouseEventHandler;
    onClick?: React.MouseEventHandler;
  }> & { ref?: React.Ref<HTMLElement> };
  /** The text content of the tooltip */
  title: string;
  /** Delay in milliseconds before showing the tooltip. Defaults to 500ms. */
  delay?: number;
}

/**
 * Tooltip is a custom-built, portal-based tooltip component that uses Framer Motion
 * for animations. It features smart positioning with edge-of-screen detection.
 */
const Tooltip: React.FC<TooltipProps> = ({ children, title, delay = 500 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, alignCenter: true });
  const triggerRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Updates the tooltip position based on the trigger's bounding rectangle.
   * Includes logic to prevent the tooltip from going off-screen by adjusting alignment.
   */
  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const buffer = rect.width / 2;

      const isNearRight = window.innerWidth - rect.right <= buffer;
      const isNearLeft = rect.left <= buffer;

      const newTop = rect.top + window.scrollY;

      let newLeft;
      let newAlignCenter = false;

      if (isNearRight) {
        newLeft = rect.right + window.scrollX;
      } else if (isNearLeft) {
        newLeft = rect.left + window.scrollX;
      } else {
        newLeft = rect.left + rect.width / 2 + window.scrollX;
        newAlignCenter = true;
      }

      setCoords((prev) => {
        if (
          prev.top === newTop &&
          prev.left === newLeft &&
          prev.alignCenter === newAlignCenter
        ) {
          return prev;
        }
        return { top: newTop, left: newLeft, alignCenter: newAlignCenter };
      });
    }
  }, []);

  useLayoutEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener("scroll", updatePosition);
      window.addEventListener("resize", updatePosition);
    }
    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isVisible, updatePosition]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const originalRef = children.ref;
  const mergedRef = useCallback(
    (node: HTMLElement) => {
      (triggerRef as React.RefObject<HTMLElement | null>).current = node;

      if (typeof originalRef === "function") {
        originalRef(node);
      } else if (originalRef) {
        // eslint-disable-next-line react-hooks/immutability
        originalRef.current = node;
      }
    },
    [originalRef],
  );

  if (!React.isValidElement(children)) {
    console.warn("Tooltip children must be a valid React element.");
    return <>{children}</>;
  }

  const trigger = React.cloneElement(children, {
    ref: mergedRef,
    onMouseEnter: (e: React.MouseEvent) => {
      handleMouseEnter();
      children.props.onMouseEnter?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      handleMouseLeave();
      children.props.onMouseLeave?.(e);
    },
    onClick: (e: React.MouseEvent) => {
      handleMouseLeave();
      children.props.onClick?.(e);
    },
  } as object);

  return (
    <>
      {trigger}

      {createPortal(
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{
                opacity: 0,
                y: 5,
                x: coords.alignCenter ? "-50%" : "-100%",
                scale: 0.9,
              }}
              animate={{
                opacity: 1,
                y: 0,
                x: coords.alignCenter ? "-50%" : "-100%",
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 5,
                x: coords.alignCenter ? "-50%" : "-100%",
                scale: 0.9,
              }}
              style={{
                position: "absolute",
                top: coords.top - 35,
                left: coords.left,
                backgroundColor: "rgba(97, 97, 97, 0.95)",
                color: "white",
                padding: "4px 10px",
                borderRadius: "4px",
                fontSize: "1rem",
                zIndex: 9999,
                whiteSpace: "nowrap",
                pointerEvents: "none",
                boxShadow: "0px 2px 8px rgba(0,0,0,0.25)",
              }}
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
};

export default Tooltip;
