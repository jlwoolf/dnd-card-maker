import React, { useState, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

interface TooltipProps {
  children: React.ReactElement;
  title: string;
  delay?: number; // Optional delay prop
}

const Tooltip: React.FC<TooltipProps> = ({ children, title, delay = 500 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    // Clear any existing timer to avoid conflicts
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    // Clear the timer so it doesn't show up after the mouse has already left
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
