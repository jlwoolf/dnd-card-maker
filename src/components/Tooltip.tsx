import React, { useState, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

interface TooltipProps {
  /** The element that triggers the tooltip on hover */
  children: React.ReactElement;
  /** The text content of the tooltip */
  title: string;
  /** Delay in milliseconds before showing the tooltip */
  delay?: number;
}

/**
 * Tooltip is a custom implementation that uses Framer Motion for animations
 * and portals the content to the body for proper z-index handling.
 */
const Tooltip: React.FC<TooltipProps> = ({ children, title, delay = 500 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Updates the tooltip position based on the trigger element's bounding box.
   */
  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top + window.scrollY,
        left: rect.left + rect.width / 2 + window.scrollX,
      });
    }
  };

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
  }, [isVisible]);

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

  return (
    <>
      <div
        ref={triggerRef}
        style={{ display: "inline-block" }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>

      {createPortal(
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ opacity: 0, y: 5, x: "-50%", scale: 0.9 }}
              animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
              exit={{ opacity: 0, y: 5, x: "-50%", scale: 0.9 }}
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
