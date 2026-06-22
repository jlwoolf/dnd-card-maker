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
  const [coords, setCoords] = useState({ top: 0, left: 0, align: "center" as "center" | "left" | "right" });
  const triggerRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const edgeThreshold = 120;

      const isNearRight = window.innerWidth - rect.right <= edgeThreshold;
      const isNearLeft = rect.left <= edgeThreshold;

      const newTop = rect.top;

      let newLeft;
      let newAlign: "center" | "left" | "right" = "center";

      if (isNearRight) {
        newLeft = rect.right;
        newAlign = "right";
      } else if (isNearLeft) {
        newLeft = rect.left;
        newAlign = "left";
      } else {
        newLeft = rect.left + rect.width / 2;
        newAlign = "center";
      }

      setCoords((prev) => {
        if (
          prev.top === newTop &&
          prev.left === newLeft &&
          prev.align === newAlign
        ) {
          return prev;
        }
        return { top: newTop, left: newLeft, align: newAlign };
      });
    }
  }, []);

  useLayoutEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener("resize", updatePosition);
    }
    return () => {
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
                x:
                  coords.align === "center"
                    ? "-50%"
                    : coords.align === "right"
                      ? "-100%"
                      : "0%",
                scale: 0.9,
              }}
              animate={{
                opacity: 1,
                x:
                  coords.align === "center"
                    ? "-50%"
                    : coords.align === "right"
                      ? "-100%"
                      : "0%",
                scale: 1,
              }}
              exit={{
                opacity: 0,
                x:
                  coords.align === "center"
                    ? "-50%"
                    : coords.align === "right"
                      ? "-100%"
                      : "0%",
                scale: 0.9,
              }}
              style={{
                position: "fixed",
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
